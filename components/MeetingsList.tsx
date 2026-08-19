"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { analyzeMeeting, setMeetingStatus } from "@/lib/actions";

export type MeetingRow = {
  id: string;
  title: string;
  date: string | null;
  participants: string | null;
  status: string;
  feedbackCount: number;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function MeetingsList({ meetings }: { meetings: MeetingRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onStatusChange = (id: string, status: string) => {
    setErrors((e) => ({ ...e, [id]: "" }));
    setBusyId(id);
    startTransition(async () => {
      const result = await setMeetingStatus(id, status);
      setBusyId(null);
      if (result.error) {
        setErrors((e) => ({ ...e, [id]: result.error! }));
      } else {
        router.refresh();
      }
    });
  };

  const onAnalyze = (id: string) => {
    setErrors((e) => ({ ...e, [id]: "" }));
    setBusyId(id);
    startTransition(async () => {
      const result = await analyzeMeeting(id);
      setBusyId(null);
      if (result.error) {
        setErrors((e) => ({ ...e, [id]: result.error! }));
      } else {
        router.push(`/feedback?meeting=${id}`);
      }
    });
  };

  const busy = (id: string) => isPending && busyId === id;

  return (
    <div className="fi-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-paper/60">
            <th className="fi-th">Meeting title</th>
            <th className="fi-th">Date</th>
            <th className="fi-th">Participants</th>
            <th className="fi-th">Feedback items</th>
            <th className="fi-th">Status</th>
            <th className="fi-th text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((meeting) => {
            const isAnalyzed = meeting.status === "analyzed";
            const isBusy = busy(meeting.id);
            return (
              <tr
                key={meeting.id}
                className="border-b border-line last:border-b-0 hover:bg-paper/50"
              >
                <td className="fi-td py-3 font-medium text-ink">
                  {meeting.title}
                </td>
                <td className="fi-td py-3 font-mono text-xs">
                  {formatDate(meeting.date)}
                </td>
                <td className="fi-td py-3">{meeting.participants || "—"}</td>
                <td className="fi-td py-3 font-mono text-xs">
                  {meeting.feedbackCount}
                </td>
                <td className="fi-td py-3">
                  <select
                    aria-label={`Change status for ${meeting.title}`}
                    value={meeting.status}
                    disabled={isBusy}
                    onChange={(e) => onStatusChange(meeting.id, e.target.value)}
                    className="rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-xs font-medium capitalize text-ink transition-colors hover:border-signal disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="saved">Saved</option>
                    <option value="analyzed">Analyzed</option>
                  </select>
                </td>
                <td className="fi-td py-3">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {!isAnalyzed ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onAnalyze(meeting.id)}
                          className="fi-btn-primary px-3 py-1.5"
                        >
                          {isBusy ? "Analyzing…" : "Analyze"}
                        </button>
                      ) : null}
                      <Link
                        href={`/feedback?meeting=${meeting.id}`}
                        className={
                          isAnalyzed
                            ? "fi-btn-primary px-3 py-1.5"
                            : "fi-btn-secondary px-3 py-1.5"
                        }
                      >
                        Review
                      </Link>
                    </div>
                    {errors[meeting.id] ? (
                      <p className="text-right text-xs text-danger">
                        {errors[meeting.id]}
                      </p>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}