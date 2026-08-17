import Link from "next/link";
import { supabase } from "@/lib/supabase";
import EmptyState from "@/components/EmptyState";

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

  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, date, participants, status, created_at, feedback(id)")
    .order("created_at", { ascending: false });

  const list = (meetings ?? []) as Meeting[];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Meetings
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Transcripts you have saved and analyzed.
          </p>
        </div>
        <Link
          href="/meetings/new"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="mr-2 h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Meeting
        </Link>
      </div>

      {saved === "1" ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Meeting saved successfully.
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">Meeting title</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Participants</th>
              <th className="px-4 py-3 font-medium">Feedback items</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10">
                  <EmptyState
                    title="No meetings yet"
                    description="Save your first meeting to start analyzing transcripts."
                    action={
                      <Link
                        href="/meetings/new"
                        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                      >
                        Add Meeting
                      </Link>
                    }
                  />
                </td>
              </tr>
            ) : (
              list.map((meeting) => (
                <tr
                  key={meeting.id}
                  className="border-b border-zinc-100 last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {meeting.title}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {meeting.date
                      ? new Date(meeting.date).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {meeting.participants || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {meeting.feedback.length}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                      {meeting.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}