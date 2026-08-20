"use server";

import { createClient } from "@/lib/supabase-server";
import { getUserAiKey, type Supabase } from "@/lib/ai-quota";
import {
  AiQuotaError,
  analyzeTranscript,
  generateTicketDraft,
  testAiProvider,
  type ProviderConfig,
} from "@/lib/ai";
import type { TicketSource } from "@/lib/ai";
import {
  REVIEW_STATUSES,
  TICKET_SECTIONS,
  PROVIDER_BASE_URLS,
  type TicketDraft,
} from "@/lib/constants";
import {
  createJiraTicket,
  syncJiraTicket,
  testJiraConnection,
  type JiraTicketSection,
} from "@/lib/jira";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type SubmitMeetingState = { error?: string };

const QUOTA_FALLBACK_MESSAGE =
  "The app's shared AI quota is currently exhausted or rate-limited. Add your own API key in Settings to keep generating — Groq, OpenAI, and OpenRouter are supported. Claude is not supported yet.";

type AiResult<T> = { value: T } | { error: string };

async function withAiProvider<T>(
  supabase: Supabase,
  run: (config?: ProviderConfig) => Promise<T>
): Promise<AiResult<T>> {
  try {
    return { value: await run(undefined) };
  } catch (err) {
    if (err instanceof AiQuotaError) {
      const own = await getUserAiKey(supabase);
      if (!own) {
        return { error: QUOTA_FALLBACK_MESSAGE };
      }
      try {
        return { value: await run(own) };
      } catch (err2) {
        if (err2 instanceof AiQuotaError) {
          return {
            error:
              "Your own AI key is also out of quota or rate-limited right now. Check it in Settings or try again shortly.",
          };
        }
        return {
          error:
            "The AI request using your own key failed. Check the key and model in Settings.",
        };
      }
    }
    return { error: "The AI request could not be completed. Please try again." };
  }
}

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

  const analysis = await withAiProvider(supabase, (config) =>
    analyzeTranscript(transcript, context, config)
  );
  if ("error" in analysis) {
    await supabase
      .from("meetings")
      .update({ status: "saved" })
      .eq("id", meeting.id);
    return { error: analysis.error };
  }
  const items = analysis.value;

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

export type UpdateFeedbackState = { error?: string; saved?: boolean; draft?: TicketDraft };

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

  const status = String(formData.get("status") ?? "").trim().toLowerCase();
  if (REVIEW_STATUSES.includes(status)) {
    update.review_status = status;
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

  if (action === "generate") {
    const extraContext =
      String(formData.get("ticket_context") ?? "").trim() || null;

    const { data: fb, error: fbError } = await supabase
      .from("feedback")
      .select("*")
      .eq("id", id)
      .single();

    if (fbError || !fb) {
      return { error: "This feedback item no longer exists." };
    }

    const { data: transcript } = await supabase
      .from("transcripts")
      .select("content")
      .eq("meeting_id", fb.meeting_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const result = await withAiProvider(supabase, (config) =>
      generateTicketDraft(
        fb as TicketSource,
        transcript?.content ?? null,
        extraContext,
        config
      )
    );
    if ("error" in result) {
      return { error: result.error };
    }

    return { draft: result.value };
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

    const summary =
      String(formData.get("draft_summary") ?? "").trim() || row.title;

    const sections: JiraTicketSection[] = [];
    for (const section of TICKET_SECTIONS) {
      const body = String(formData.get(`draft_${section.id}`) ?? "").trim();
      if (body) {
        sections.push({
          heading: section.heading,
          body,
          format: section.format,
        });
      }
    }

    if (sections.length === 0) {
      return {
        error: "No ticket content was found. Generate a draft first.",
      };
    }

    const extraContext = String(formData.get("ticket_context") ?? "").trim();
    if (extraContext && !sections.some((s) => s.body.includes(extraContext))) {
      sections.push({
        heading: "Additional context",
        body: extraContext,
        format: "text",
      });
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
        summary,
        sections,
        row.type,
        String(formData.get("ticket_type") ?? "").trim() || null
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

export type SyncTicketResult =
  | { ok: true; ticket_key: string }
  | { ok: false; error: string };

export async function syncJiraTicketAction(
  formData: FormData
): Promise<SyncTicketResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in." };
  }

  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  if (!ticketId) {
    return { ok: false, error: "No ticket was provided." };
  }

  const { data: ticket } = await supabase
    .from("jira_tickets")
    .select("id, ticket_key, jira_connection_id")
    .eq("id", ticketId)
    .single();
  if (!ticket?.ticket_key || !ticket.jira_connection_id) {
    return { ok: false, error: "That ticket could not be found." };
  }

  const key = process.env.JIRA_TOKEN_KEY;
  if (!key) {
    return { ok: false, error: "Jira encryption is not configured on the server." };
  }

  const { data: token, error: decryptError } = await supabase.rpc(
    "decrypt_jira_token",
    { p_id: ticket.jira_connection_id, p_key: key }
  );
  if (decryptError || !token) {
    return { ok: false, error: "Could not read your Jira workspace." };
  }

  const { data: conn } = await supabase
    .from("jira_connections")
    .select("site_url, email")
    .eq("id", ticket.jira_connection_id)
    .single();
  if (!conn) {
    return { ok: false, error: "Could not read your Jira workspace." };
  }

  try {
    const synced = await syncJiraTicket(
      { siteUrl: conn.site_url, email: conn.email, token },
      ticket.ticket_key
    );

    const { error: updateError } = await supabase
      .from("jira_tickets")
      .update({
        status: synced.status,
        sprint: synced.sprint,
        assignee: synced.assignee,
      })
      .eq("id", ticket.id);
    if (updateError) {
      return {
        ok: false,
        error: "Jira was synced, but the changes could not be saved here.",
      };
    }

    revalidatePath("/jira");
    revalidatePath("/feedback");
    revalidatePath("/feedback/[id]", "page");
    return { ok: true, ticket_key: ticket.ticket_key };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not sync the ticket.",
    };
  }
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
    const detail = saveError.message
      ? saveError.message.replace(/^save_jira_connection:?\s*/i, "")
      : "";
    return {
      error: detail
        ? `Could not save the connection: ${detail}`
        : "Could not save the connection. Please try again.",
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

export type AiKeyState = { error?: string; saved?: boolean };

const SUPPORTED_PROVIDERS = ["groq", "openai", "openrouter"];

export async function saveAiKey(
  _prevState: AiKeyState,
  formData: FormData
): Promise<AiKeyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You need to be signed in." };
  }

  const id = String(formData.get("id") ?? "").trim() || null;
  const provider = String(formData.get("provider") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const baseUrl = String(formData.get("base_url") ?? "").trim() || null;
  const apiKey = String(formData.get("api_key") ?? "").trim();

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return {
      error:
        "Please choose a supported provider (Groq, OpenAI, or OpenRouter). Claude is not supported yet.",
    };
  }
  if (!model) {
    return { error: "Please enter the model name." };
  }
  if (!apiKey && !id) {
    return { error: "Please enter your API key." };
  }

  const master = process.env.JIRA_TOKEN_KEY;
  if (!master) {
    return { error: "AI key encryption is not configured on the server." };
  }

  let effectiveKey = apiKey;
  if (!effectiveKey && id) {
    const { data: existing } = await supabase.rpc("decrypt_ai_key", {
      p_id: id,
      p_key: master,
    });
    if (!existing) {
      return { error: "Could not read the stored key. Enter the key again." };
    }
    effectiveKey = existing;
  }

  const test = await testAiProvider({
    baseUrl: baseUrl || PROVIDER_BASE_URLS[provider],
    apiKey: effectiveKey,
    model,
  });
  if (!test.ok) {
    return { error: test.error };
  }

  const { error: saveError } = await supabase.rpc("save_ai_key", {
    p_key: master,
    p_provider: provider,
    p_model: model,
    p_base_url: baseUrl,
    p_api_key: apiKey || null,
    p_key_tail: effectiveKey.slice(-4),
    p_id: id,
  });

  if (saveError) {
    const detail = saveError.message.replace(/^save_ai_key:?\s*/i, "");
    return {
      error: detail
        ? `Could not save the key: ${detail}`
        : "Could not save the key. Please try again.",
    };
  }

  return { saved: true };
}

export async function deleteAiKey(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await supabase.from("ai_keys").delete().eq("id", id);
  }
  redirect("/settings?ai_deleted=1");
}

export type MeetingActionState = { error?: string };

export async function analyzeMeeting(
  meetingId: string
): Promise<MeetingActionState> {
  const supabase = await createClient();

  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("id, context, date, status")
    .eq("id", meetingId)
    .single();

  if (meetingError || !meeting) {
    return { error: "Meeting not found." };
  }
  if (meeting.status === "analyzed") {
    return { error: "This meeting has already been analyzed." };
  }

  const { data: transcript } = await supabase
    .from("transcripts")
    .select("id, content")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!transcript?.content) {
    return { error: "No transcript found for this meeting." };
  }

  const analysis = await withAiProvider(supabase, (config) =>
    analyzeTranscript(transcript.content, meeting.context, config)
  );
  if ("error" in analysis) {
    return { error: analysis.error };
  }
  const items = analysis.value;

  if (items.length > 0) {
    const rows = items.map((item) => ({
      meeting_id: meetingId,
      transcript_id: transcript.id,
      title: item.title,
      type: item.type,
      reporter: item.reporter,
      reporter_team: item.reporter_team,
      reported_date: item.reported_date ?? meeting.date,
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
        error: "Analysis finished, but the feedback could not be saved. Please try again.",
      };
    }
  }

  await supabase
    .from("meetings")
    .update({ status: "analyzed" })
    .eq("id", meetingId);

  return {};
}

export async function setMeetingStatus(
  meetingId: string,
  status: string
): Promise<MeetingActionState> {
  if (!["saved", "analyzed"].includes(status)) {
    return { error: "Invalid status." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ status })
    .eq("id", meetingId);
  if (error) {
    return { error: "Could not update the meeting status." };
  }
  return {};
}

export type FeedbackStatusState = { error?: string };

export async function setFeedbackStatus(
  feedbackId: string,
  status: string
): Promise<FeedbackStatusState> {
  if (!REVIEW_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("feedback")
    .update({ review_status: status })
    .eq("id", feedbackId);
  if (error) {
    return { error: "Could not update the review status." };
  }
  return {};
}

export type CreateReviewState = { error?: string; success?: string };

export async function createReview(
  _prevState: CreateReviewState,
  formData: FormData
): Promise<CreateReviewState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You need to be signed in to leave a review." };
  }

  const rating = Number(String(formData.get("rating") ?? "").trim());
  const comment = String(formData.get("comment") ?? "").trim();
  const authorName = String(formData.get("author_name") ?? "").trim() || null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Please select a rating from 1 to 5." };
  }
  if (!comment) {
    return { error: "Please write a comment." };
  }
  if (authorName && authorName.length > 80) {
    return { error: "Name must be 80 characters or fewer." };
  }

  const { error } = await supabase.from("reviews").insert({
    rating,
    comment,
    author_name: authorName,
    user_id: user.id,
  });

  if (error) {
    return { error: "Could not save your review. Please try again." };
  }

  revalidatePath("/reviews");
  revalidatePath("/");
  return { success: "Thanks for your review!" };
}

export type CreateFeatureRequestState = { error?: string; success?: string };

export async function createFeatureRequest(
  _prevState: CreateFeatureRequestState,
  formData: FormData
): Promise<CreateFeatureRequestState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You need to be signed in to send a feature request." };
  }

  const featureDescription = String(
    formData.get("feature_description") ?? ""
  ).trim();
  const problem = String(formData.get("problem") ?? "").trim();
  const authorName = String(formData.get("author_name") ?? "").trim() || null;

  if (!featureDescription) {
    return { error: "Please describe the feature." };
  }
  if (!problem) {
    return { error: "Please tell us what problem it would solve." };
  }
  if (authorName && authorName.length > 80) {
    return { error: "Name must be 80 characters or fewer." };
  }

  const { error } = await supabase.from("feature_requests").insert({
    feature_description: featureDescription,
    problem,
    author_name: authorName,
    user_id: user.id,
  });

  if (error) {
    return { error: "Could not send your request. Please try again." };
  }

  revalidatePath("/reviews");
  return { success: "Thanks — your feature request was sent!" };
}