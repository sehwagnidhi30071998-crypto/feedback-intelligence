"use client";

import type { ReactNode } from "react";
import { useState, useSyncExternalStore } from "react";

export type FeedbackRow = {
  id: string;
  title: string;
  type: string | null;
  reporter: string | null;
  reporterTeam: string | null;
  reportedDate: string | null;
  problem: string | null;
  requestedChange: string | null;
  proposedImplementation: string | null;
  domainKnowledge: string | null;
  transcriptEvidence: string | null;
  confidence: number | null;
  impact: number | null;
  ease: number | null;
  iceScore: number | null;
  reviewStatus: string;
  jiraTicket: string | null;
  jiraStatus: string | null;
  sprint: string | null;
  assignee: string | null;
};

type ColumnId =
  | "title"
  | "type"
  | "reporter"
  | "reporterTeam"
  | "reportedDate"
  | "problem"
  | "requestedChange"
  | "proposedImplementation"
  | "domainKnowledge"
  | "transcriptEvidence"
  | "confidence"
  | "impact"
  | "ease"
  | "iceScore"
  | "reviewStatus"
  | "jiraTicket"
  | "jiraStatus"
  | "sprint"
  | "assignee";

const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: "title", label: "Title" },
  { id: "type", label: "Type" },
  { id: "reporter", label: "Reporter" },
  { id: "reporterTeam", label: "Reporter team" },
  { id: "reportedDate", label: "Reported date" },
  { id: "problem", label: "Problem" },
  { id: "requestedChange", label: "Requested change" },
  { id: "proposedImplementation", label: "Proposed implementation" },
  { id: "domainKnowledge", label: "Domain knowledge" },
  { id: "transcriptEvidence", label: "Transcript evidence" },
  { id: "confidence", label: "Confidence" },
  { id: "impact", label: "Impact" },
  { id: "ease", label: "Ease" },
  { id: "iceScore", label: "ICE score" },
  { id: "reviewStatus", label: "Review status" },
  { id: "jiraTicket", label: "Jira ticket" },
  { id: "jiraStatus", label: "Jira status" },
  { id: "sprint", label: "Sprint" },
  { id: "assignee", label: "Assignee" },
];

const DEFAULT_VISIBLE: ColumnId[] = [
  "title",
  "type",
  "reporter",
  "reportedDate",
  "reviewStatus",
  "iceScore",
  "jiraTicket",
];

const STORAGE_KEY = "fi-feedback-columns";

let snapshot: ColumnId[] = DEFAULT_VISIBLE;
const listeners = new Set<() => void>();

function readStored(): ColumnId[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ColumnId[];
    const valid = parsed.filter((id) => COLUMNS.some((c) => c.id === id));
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

function persist(next: ColumnId[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage failures
  }
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  const stored = readStored();
  if (stored && stored !== snapshot) {
    snapshot = stored;
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return DEFAULT_VISIBLE;
}

const statusBadge: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  duplicate: "bg-zinc-100 text-zinc-600",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function cellValue(row: FeedbackRow, id: ColumnId): ReactNode {
  switch (id) {
    case "title":
      return <span className="font-medium text-zinc-900">{row.title}</span>;
    case "type":
      return row.type ?? "—";
    case "reporter":
      return row.reporter ?? "—";
    case "reporterTeam":
      return row.reporterTeam ?? "—";
    case "reportedDate":
      return formatDate(row.reportedDate);
    case "problem":
      return <span title={row.problem ?? ""}>{row.problem ?? "—"}</span>;
    case "requestedChange":
      return (
        <span title={row.requestedChange ?? ""}>
          {row.requestedChange ?? "—"}
        </span>
      );
    case "proposedImplementation":
      return (
        <span title={row.proposedImplementation ?? ""}>
          {row.proposedImplementation ?? "—"}
        </span>
      );
    case "domainKnowledge":
      return <span title={row.domainKnowledge ?? ""}>{row.domainKnowledge ?? "—"}</span>;
    case "transcriptEvidence":
      return (
        <span
          className="font-mono text-xs text-zinc-500"
          title={row.transcriptEvidence ?? ""}
        >
          {row.transcriptEvidence ?? "—"}
        </span>
      );
    case "confidence":
      return row.confidence !== null ? `${row.confidence}%` : "—";
    case "impact":
      return row.impact !== null ? String(row.impact) : "—";
    case "ease":
      return row.ease !== null ? String(row.ease) : "—";
    case "iceScore":
      return row.iceScore !== null ? row.iceScore.toLocaleString() : "—";
    case "reviewStatus": {
      const label = row.reviewStatus;
      const classes =
        statusBadge[label.toLowerCase()] ?? "bg-zinc-100 text-zinc-600";
      return (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}
        >
          {label}
        </span>
      );
    }
    case "jiraTicket":
      return row.jiraTicket ?? "—";
    case "jiraStatus":
      return row.jiraStatus ?? "—";
    case "sprint":
      return row.sprint ?? "—";
    case "assignee":
      return row.assignee ?? "—";
  }
}

export default function FeedbackTable({ rows }: { rows: FeedbackRow[] }) {
  const visible = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const [open, setOpen] = useState(false);

  const toggle = (id: ColumnId) => {
    const next = visible.includes(id)
      ? visible.filter((x) => x !== id)
      : [...visible, id];
    persist(next);
  };

  const reset = () => {
    persist(DEFAULT_VISIBLE);
  };

  const visibleColumns = COLUMNS.filter((c) => visible.includes(c.id));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div>
          <h2 className="text-base font-medium text-zinc-900">Feedback items</h2>
          <p className="text-xs text-zinc-500">
            {rows.length} item{rows.length === 1 ? "" : "s"} ·{" "}
            {visibleColumns.length} of {COLUMNS.length} columns shown
          </p>
        </div>
        <div className="relative">
          {open ? (
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
              aria-hidden
            />
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
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
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
              />
            </svg>
            Columns
          </button>
          {open ? (
            <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
              <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                Show / hide columns
              </p>
              <div className="max-h-64 space-y-0.5 overflow-auto pr-1">
                {COLUMNS.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      checked={visible.includes(c.id)}
                      onChange={() => toggle(c.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-indigo-600"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={reset}
                className="mt-2 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                Reset to defaults
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              {visibleColumns.map((c) => (
                <th key={c.id} className="whitespace-nowrap px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} className="px-4 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-base font-medium text-zinc-900">
                      No feedback items yet
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-zinc-500">
                      Feedback items will appear here after you analyze a meeting
                      transcript.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100 last:border-b-0"
                >
                  {visibleColumns.map((c) => (
                    <td
                      key={c.id}
                      className="max-w-[220px] truncate px-4 py-3 text-zinc-700"
                    >
                      {cellValue(row, c.id)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}