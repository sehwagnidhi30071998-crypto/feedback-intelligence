"use server";

import { createClient } from "@/lib/supabase-server";
import { analyzeTranscript } from "@/lib/ai";
import {
  createJiraTicket,
  testJiraConnection,
  type JiraFeedbackInput,
} from "@/lib/jira";
import { redirect } from "next/navigation";

export type SubmitMeetingState = { error?: string };

export async function submitMeeting(
  _prevState: SubmitMeetingState,
  formData: FormData
): Promise<SubmitMeetingState> {
  const intent = String(formData.get("intent") ?? "save");
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim() || null;
  const participants = String(formData.get("participants") ?? "").trim() || null;
  const context = String(formData.get("context") ?? "").trim() || null;
  const transcript = String(formData.get("transcript") ?? "").trim();

  if (!title) {
    return { error: "Please enter a meeting title." };
  }
  if (!transcript) {
    return { error: "Please paste the meeting transcript." };
  }

  const supabase = await createClient();

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .insert({
      title,
      date,
      participants,
      context,
      status: intent === "analyze" ? "analyzed" : "saved",
    })
    .select("id")
    .single();

  if (meetingError || !meeting) {
    return {
      error: "Could not save the meeting to the database. Please try again.",
    };
  }

  const { error: transcriptError } = await supabase
    .from("transcripts")
    .insert({ meeting_id: meeting.id, content: transcript });

  if (transcriptError) {
    return {
      error: "Meeting saved, but the transcript could not be stored. Please try again.",
    };
  }

  if (intent !== "analyze") {
    redirect("/meetings?saved=1");
  }

  let items;
  try {
    items = await analyzeTranscript(transcript, context);
  } catch {
    await supabase
      .from("meetings")
      .update({ status: "saved" })
      .eq("id", meeting.id);
    return {
      error: "The AI analysis could not be completed. Your meeting was saved, but no feedback was extracted. Please try analyzing again.",
    };
  }

  if (items.length > 0) {
    const rows = items.map((item) => ({
      meeting_id: meeting.id,
      title: item.title,
      type: item.type,
      reporter: item.reporter,
      reporter_team: item.reporter_team,
      reported_date: item.reported_date ?? date,
      problem: item.problem,
      requested_change: item.requested_change,
      proposed_implementation: item.proposed_implementation,
      domain_knowledge: item.domain_knowledge,
      transcript_evidence: item.transcript_evidence,
      confidence: item.confidence,
      impact: item.impact,
      ease: item.ease,
      ice_score: item.ice_score,
    }));

    const { error: feedbackError } = await supabase
      .from("feedback")
      .insert(rows);

    if (feedbackError) {
      return {
        error: "Your meeting was analyzed, but the feedback could not be saved. Please try analyzing again.",
      };
    }
  }

  redirect("/feedback?analyzed=1");
}

export type UpdateFeedbackState = { error?: string; saved?: boolean };

function toNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function updateFeedback(
  id: string,
  _prevState: UpdateFeedbackState,
  formData: FormData
): Promise<UpdateFeedbackState> {
  const action = String(formData.get("action") ?? "save");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Please enter a title." };
  }

  const update: Record<string, unknown> = {
    title,
    type: String(formData.get("type") ?? "").trim() || null,
    reporter: String(formData.get("reporter") ?? "").trim() || null,
    reporter_team: String(formData.get("reporter_team") ?? "").trim() || null,
    reported_date: String(formData.get("reported_date") ?? "").trim() || null,
    problem: String(formData.get("problem") ?? "").trim() || null,
    requested_change: String(formData.get("requested_change") ?? "").trim() || null,
    proposed_implementation: String(formData.get("proposed_implementation") ?? "").trim() || null,
    domain_knowledge: String(formData.get("domain_knowledge") ?? "").trim() || null,
    transcript_evidence: String(formData.get("transcript_evidence") ?? "").trim() || null,
    confidence: toNumber(formData.get("confidence")),
    impact: toNumber(formData.get("impact")),
    ease: toNumber(formData.get("ease")),
    ice_score: toNumber(formData.get("ice_score")),
  };

  const finalStatus: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    duplicate: "duplicate",
  };
  const nextStatus = finalStatus[action];

  if (nextStatus) {
    update.review_status = nextStatus;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("feedback")
    .update(update)
    .eq("id", id);

  if (error) {
    return { error: "Could not save your changes. Please try again." };
  }

  if (nextStatus) {
    redirect(`/feedback?action=${nextStatus}`);
  }

  if (action === "jira") {
    const connectionId = String(formData.get("connection_id") ?? "").trim();
    if (!connectionId) {
      return { error: "Please choose a Jira workspace." };
    }

    const { data: row } = await supabase
      .from("feedback")
      .select("*, jira_tickets(id)")
      .eq("id", id)
      .single();

    if (!row) {
      return { error: "This feedback item no longer exists." };
    }
    if (row.review_status !== "approved") {
      return { error: "Only approved feedback can be sent to Jira." };
    }
    if ((row.jira_tickets as { id: string }[] | null)?.length) {
      return { error: "A Jira ticket already exists for this item." };
    }

    const key = process.env.JIRA_TOKEN_KEY;
    if (!key) {
      return { error: "Jira encryption is not configured on the server." };
    }

    const { data: token, error: decryptError } = await supabase.rpc(
      "decrypt_jira_token",
      { p_id: connectionId, p_key: key }
    );
    if (decryptError || !token) {
      return { error: "Could not read your Jira workspace." };
    }

    const { data: conn } = await supabase
      .from("jira_connections")
      .select("id, name, site_url, email, project_key, issue_type")
      .eq("id", connectionId)
      .single();
    if (!conn) {
      return { error: "Could not read your Jira workspace." };
    }

    try {
      const ticket = await createJiraTicket(
        {
          siteUrl: conn.site_url,
          email: conn.email,
          token,
          projectKey: conn.project_key,
          issueType: conn.issue_type,
        },
        row as JiraFeedbackInput
      );

      const { error: insertError } = await supabase
        .from("jira_tickets")
        .insert({
          feedback_id: id,
          jira_connection_id: connectionId,
          ticket_key: ticket.key,
          ticket_url: ticket.url,
          status: ticket.status,
        });
      if (insertError) {
        return {
          error: "The ticket was created in Jira, but could not be recorded here. Check Jira and try again.",
        };
      }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not create the Jira ticket.",
      };
    }

    redirect("/feedback?created=1");
  }

  return { saved: true };
}

export type JiraConnectionState = { error?: string; saved?: boolean };

export async function saveJiraConnection(
  _prevState: JiraConnectionState,
  formData: FormData
): Promise<JiraConnectionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You need to be signed in." };
  }

  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim() || "My Jira";
  const siteUrl = String(formData.get("site_url") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const projectKey = String(formData.get("project_key") ?? "").trim();
  const issueType = String(formData.get("issue_type") ?? "").trim() || "Task";
  const token = String(formData.get("token") ?? "").trim();

  if (!siteUrl || !email || !projectKey) {
    return { error: "Site URL, email, and project key are required." };
  }
  if (!token && !id) {
    return { error: "Please enter your Jira API token." };
  }

  const key = process.env.JIRA_TOKEN_KEY;
  if (!key) {
    return { error: "Jira encryption is not configured on the server." };
  }

  let effectiveToken = token;
  if (!effectiveToken && id) {
    const { data: existing } = await supabase.rpc("decrypt_jira_token", {
      p_id: id,
      p_key: key,
    });
    if (!existing) {
      return { error: "Could not read the stored token. Enter the token again." };
    }
    effectiveToken = existing;
  }

  try {
    await testJiraConnection({
      siteUrl,
      email,
      token: effectiveToken,
      projectKey,
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Jira connection test failed.",
    };
  }

  const { error: saveError } = await supabase.rpc("save_jira_connection", {
    p_key: key,
    p_name: name,
    p_site_url: siteUrl,
    p_email: email,
    p_project_key: projectKey,
    p_issue_type: issueType,
    p_token: token || null,
    p_id: id,
  });

  if (saveError) {
    return {
      error: "Could not save the connection. Please try again.",
    };
  }

  return { saved: true };
}

export async function deleteJiraConnection(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await supabase.from("jira_connections").delete().eq("id", id);
  }
  redirect("/settings?deleted=1");
}