"use server";

import { supabase } from "@/lib/supabase";
import { analyzeTranscript } from "@/lib/ai";
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