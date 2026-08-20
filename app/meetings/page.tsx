import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import EmptyState from "@/components/EmptyState";
import MeetingsList, { type MeetingRow } from "@/components/MeetingsList";
import { noindex } from "@/lib/seo";

export const metadata: Metadata = {
  ...noindex,
  title: "Add transcript",
};

type Meeting = {
  id: string;
  title: string;
  date: string | null;
  participants: string | null;
  status: string;
  created_at: string;
  feedback: { id: string }[];
};

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, date, participants, status, created_at, feedback(id)")
    .order("created_at", { ascending: false });

  const list: MeetingRow[] = ((meetings ?? []) as unknown as Meeting[]).map(
    (m) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      participants: m.participants,
      status: m.status,
      feedbackCount: m.feedback.length,
    })
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="fi-eyebrow">Pipeline · stage 1</p>
          <h1 className="fi-page-title mt-1">Add transcript</h1>
          <p className="fi-page-sub">
            Transcripts you have saved and analyzed. Analyze a saved meeting
            anytime — no need to re-enter it.
          </p>
        </div>
        <Link href="/meetings/new" className="fi-btn-primary shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add transcript
        </Link>
      </div>

      {saved === "1" ? (
        <div className="fi-notice mt-6 border-ok-soft bg-ok-soft text-ok">
          Meeting saved successfully. You can analyze it from the list when
          you&apos;re ready.
        </div>
      ) : null}

      <div className="mt-6">
        {list.length === 0 ? (
          <EmptyState
            title="No transcripts yet"
            description="Save your first transcript to start extracting feedback items."
            action={
              <Link href="/meetings/new" className="fi-btn-primary">
                Add transcript
              </Link>
            }
          />
        ) : (
          <MeetingsList meetings={list} />
        )}
      </div>
    </div>
  );
}