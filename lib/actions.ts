"use server";

import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export type SaveMeetingState = { error?: string };

export async function saveMeeting(
  _prevState: SaveMeetingState,
  formData: FormData
): Promise<SaveMeetingState> {
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
    .insert({ title, date, participants, context, status: "saved" })
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

  redirect("/meetings?saved=1");
}