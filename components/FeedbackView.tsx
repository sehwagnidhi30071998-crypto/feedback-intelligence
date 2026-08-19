"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { setFeedbackStatus } from "@/lib/actions";

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
  jiraUrl: string | null;
  jiraStatus: string | null;
  sprint: string | null;
  assignee: string | null;
};

const statusOptions = ["pending", "approved", "rejected", "duplicate"];

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

function makeStore<T>(
  defaultValue: T,
  storageKey: string,
  parse: (raw: string) => T
) {
  let snapshot = defaultValue;
  const listeners = new Set<() => void>();

  const read = (): T => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return snapshot;
      return parse(raw);
    } catch {
      return snapshot;
    }
  };

  const subscribe = (listener: () => void) => {
    const stored = read();
    if (stored !== snapshot) snapshot = stored;
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const getSnapshot = () => snapshot;
  const getServerSnapshot = () => defaultValue;

  const set = (next: T) => {
    snapshot = next;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
    listeners.forEach((l) => l());
  };

  return { subscribe, getSnapshot, getServerSnapshot, set };
}

const columnsStore = makeStore<ColumnId[]>(
  DEFAULT_VISIBLE,
  "fi-feedback-columns",
  (raw) => {
    try {
      const parsed = JSON.parse(raw) as ColumnId[];
      return parsed.filter((id) => COLUMNS.some((c) => c.id === id));
    } catch {
      return DEFAULT_VISIBLE;
    }
  }
);

const viewStore = makeStore<"cards" | "table">(
  "cards",
  "fi-feedback-view",
  (raw) => (raw === '"table"' ? "table" : "cards")
);

const wrapStore = makeStore<boolean>(
  true,
  "fi-feedback-wrap",
  (raw) => raw !== "false"
);

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

function PrimaryAction({
  row,
  hasConnections,
  compact = false,
}: {
  row: FeedbackRow;
  hasConnections: boolean;
  compact?: boolean;
}) {
  const status = row.reviewStatus.toLowerCase();
  const size = compact ? "px-3 py-1.5" : "px-4 py-2";

  if (row.jiraTicket) {
    return row.jiraUrl ? (
      <a
        href={row.jiraUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`fi-btn-primary ${size}`}
      >
        View ticket
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
            d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          />
        </svg>
      </a>
    ) : (
      <span className={`fi-badge bg-paper text-muted ${size}`}>
        {row.jiraTicket}
      </span>
    );
  }

  if (status === "approved") {
    return hasConnections ? (
      <Link href={`/feedback/${row.id}`} className={`fi-btn-primary ${size}`}>
        Create Jira ticket
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
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    ) : (
      <Link
        href="/settings"
        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-95 ${
          compact ? "px-3 py-1.5" : ""
        }`}
      >
        Connect Jira
      </Link>
    );
  }

  return (
    <Link href={`/feedback/${row.id}`} className={`fi-btn-primary ${size}`}>
      Review
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
          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
        />
      </svg>
    </Link>
  );
}

function StatusSelect({
  row,
  busy,
  onChange,
}: {
  row: FeedbackRow;
  busy: boolean;
  onChange: (id: string, status: string) => void;
}) {
  const status = row.reviewStatus.toLowerCase();
  return (
    <select
      aria-label={`Change review status for ${row.title}`}
      value={status}
      disabled={busy}
      onChange={(e) => onChange(row.id, e.target.value)}
      className="rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-xs font-medium capitalize text-ink transition-colors hover:border-signal disabled:cursor-not-allowed disabled:opacity-60"
    >
      {statusOptions.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="fi-eyebrow">{label}</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
        {value && value.length > 0 ? value : "—"}
      </p>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-line bg-paper/60 px-3 py-2 text-center">
      <p className="font-mono text-lg font-medium leading-none text-ink">
        {value !== null ? value : "—"}
      </p>
      <p className="fi-eyebrow mt-1.5">{label}</p>
    </div>
  );
}

function CardsView({
  rows,
  hasConnections,
  busyId,
  errors,
  onStatusChange,
}: {
  rows: FeedbackRow[];
  hasConnections: boolean;
  busyId: string | null;
  errors: Record<string, string>;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {rows.map((row) => {
        const busy = busyId === row.id;
        const status = row.reviewStatus.toLowerCase();
        return (
          <article
            key={row.id}
            className="fi-card flex flex-col overflow-hidden transition-all hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold leading-snug text-ink">
                  {row.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
                  {row.type ? <span>{row.type}</span> : null}
                  {row.reporter ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{row.reporter}</span>
                    </>
                  ) : null}
                  {row.reporterTeam ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>{row.reporterTeam}</span>
                    </>
                  ) : null}
                  <span aria-hidden>·</span>
                  <span className="font-mono">{formatDate(row.reportedDate)}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <StatusSelect
                    row={row}
                    busy={busy}
                    onChange={onStatusChange}
                  />
                  <PrimaryAction row={row} hasConnections={hasConnections} compact />
                </div>
                {errors[row.id] ? (
                  <p className="text-right text-xs text-danger">
                    {errors[row.id]}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 p-5">
              <Field label="Problem" value={row.problem} />
              <Field label="Requested change" value={row.requestedChange} />
              <Field label="Proposed implementation" value={row.proposedImplementation} />
              <Field label="Domain knowledge" value={row.domainKnowledge} />

              {row.transcriptEvidence ? (
                <div className="rounded-lg border border-line bg-paper/60 p-3">
                  <p className="fi-eyebrow">Transcript evidence</p>
                  <p className="mt-1 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted">
                    {row.transcriptEvidence}
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-4 gap-2">
                <ScoreChip label="Confidence" value={row.confidence} />
                <ScoreChip label="Impact" value={row.impact} />
                <ScoreChip label="Ease" value={row.ease} />
                <ScoreChip label="ICE" value={row.iceScore} />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {row.jiraTicket ? (
                  row.jiraUrl ? (
                    <a
                      href={row.jiraUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fi-link font-mono text-xs"
                    >
                      {row.jiraTicket}
                    </a>
                  ) : (
                    <span className="font-mono text-xs font-medium text-ink">
                      {row.jiraTicket}
                    </span>
                  )
                ) : null}
                {row.jiraStatus ? <span className="text-faint">· {row.jiraStatus}</span> : null}
                {row.sprint ? <span className="text-faint">· Sprint {row.sprint}</span> : null}
                {row.assignee ? <span className="text-faint">· {row.assignee}</span> : null}
                {!row.jiraTicket && status === "approved" && !hasConnections ? (
                  <span className="fi-badge bg-amber-soft text-amber">
                    Connect a Jira workspace to create tickets
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function cellContent(
  row: FeedbackRow,
  id: ColumnId,
  busy: boolean,
  onStatusChange: (id: string, status: string) => void
): ReactNode {
  switch (id) {
    case "title":
      return (
        <Link
          href={`/feedback/${row.id}`}
          className="font-medium text-ink transition-colors hover:text-signal"
        >
          {row.title}
        </Link>
      );
    case "type":
      return row.type ?? "—";
    case "reporter":
      return row.reporter ?? "—";
    case "reporterTeam":
      return row.reporterTeam ?? "—";
    case "reportedDate":
      return <span className="font-mono text-xs">{formatDate(row.reportedDate)}</span>;
    case "problem":
      return row.problem && row.problem.length > 0 ? row.problem : "—";
    case "requestedChange":
      return row.requestedChange && row.requestedChange.length > 0
        ? row.requestedChange
        : "—";
    case "proposedImplementation":
      return row.proposedImplementation && row.proposedImplementation.length > 0
        ? row.proposedImplementation
        : "—";
    case "domainKnowledge":
      return row.domainKnowledge && row.domainKnowledge.length > 0
        ? row.domainKnowledge
        : "—";
    case "transcriptEvidence":
      return row.transcriptEvidence && row.transcriptEvidence.length > 0 ? (
        <span className="font-mono text-xs text-faint">
          {row.transcriptEvidence}
        </span>
      ) : (
        "—"
      );
    case "confidence":
      return (
        <span className="font-mono text-xs">
          {row.confidence !== null ? `${row.confidence}%` : "—"}
        </span>
      );
    case "impact":
      return <span className="font-mono text-xs">{row.impact ?? "—"}</span>;
    case "ease":
      return <span className="font-mono text-xs">{row.ease ?? "—"}</span>;
    case "iceScore":
      return (
        <span className="font-mono text-xs font-medium text-ink">
          {row.iceScore !== null ? row.iceScore.toLocaleString() : "—"}
        </span>
      );
    case "reviewStatus":
      return <StatusSelect row={row} busy={busy} onChange={onStatusChange} />;
    case "jiraTicket":
      return row.jiraUrl ? (
        <a
          href={row.jiraUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fi-link font-mono text-xs"
        >
          {row.jiraTicket ?? "—"}
        </a>
      ) : (
        row.jiraTicket ?? "—"
      );
    case "jiraStatus":
      return row.jiraStatus ?? "—";
    case "sprint":
      return row.sprint ?? "—";
    case "assignee":
      return row.assignee ?? "—";
  }
}

function TableView({
  rows,
  visible,
  wrap,
  hasConnections,
  busyId,
  errors,
  onStatusChange,
}: {
  rows: FeedbackRow[];
  visible: ColumnId[];
  wrap: boolean;
  hasConnections: boolean;
  busyId: string | null;
  errors: Record<string, string>;
  onStatusChange: (id: string, status: string) => void;
}) {
  const visibleColumns = COLUMNS.filter((c) => visible.includes(c.id));
  const cellClasses = `px-4 py-3 align-top text-sm ${
    wrap ? "min-w-40 whitespace-pre-wrap break-words" : "max-w-[220px] truncate"
  }`;

  return (
    <div className="fi-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-paper/60">
              {visibleColumns.map((c) => (
                <th key={c.id} className="fi-th">
                  {c.label}
                </th>
              ))}
              <th className="fi-th text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const busy = busyId === row.id;
              return (
                <tr
                  key={row.id}
                  className="border-b border-line align-top last:border-b-0 hover:bg-paper/50"
                >
                  {visibleColumns.map((c) => (
                    <td key={c.id} className={cellClasses}>
                      {cellContent(row, c.id, busy, onStatusChange)}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top">
                    <div className="flex flex-col items-end gap-1.5">
                      <PrimaryAction row={row} hasConnections={hasConnections} compact />
                      {errors[row.id] ? (
                        <p className="text-right text-xs text-danger">
                          {errors[row.id]}
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
    </div>
  );
}

export default function FeedbackView({
  rows,
  hasConnections,
}: {
  rows: FeedbackRow[];
  hasConnections: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [columnsOpen, setColumnsOpen] = useState(false);

  const view = useSyncExternalStore(
    viewStore.subscribe,
    viewStore.getSnapshot,
    viewStore.getServerSnapshot
  );
  const wrap = useSyncExternalStore(
    wrapStore.subscribe,
    wrapStore.getSnapshot,
    wrapStore.getServerSnapshot
  );
  const visible = useSyncExternalStore(
    columnsStore.subscribe,
    columnsStore.getSnapshot,
    columnsStore.getServerSnapshot
  );

  const onStatusChange = (id: string, status: string) => {
    setErrors((e) => ({ ...e, [id]: "" }));
    setBusyId(id);
    startTransition(async () => {
      const result = await setFeedbackStatus(id, status);
      setBusyId(null);
      if (result.error) {
        setErrors((e) => ({ ...e, [id]: result.error! }));
      } else {
        router.refresh();
      }
    });
  };

  const toggleColumn = (id: ColumnId) => {
    const next = visible.includes(id)
      ? visible.filter((x) => x !== id)
      : [...visible, id];
    columnsStore.set(next);
  };

  const resetColumns = () => columnsStore.set(DEFAULT_VISIBLE);

  return (
    <div className="space-y-4">
      <div className="fi-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">
            Feedback items
          </h2>
          <p className="text-xs text-faint">
            {rows.length} item{rows.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {view === "table" ? (
            <>
              <button
                type="button"
                onClick={() => wrapStore.set(!wrap)}
                aria-pressed={wrap}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  wrap
                    ? "border-signal bg-signal-soft text-signal-strong"
                    : "border-line-strong bg-white text-muted hover:bg-paper"
                }`}
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
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h10.5"
                  />
                </svg>
                Wrap {wrap ? "on" : "off"}
              </button>

              <div className="relative">
                {columnsOpen ? (
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setColumnsOpen(false)}
                    aria-hidden
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => setColumnsOpen((o) => !o)}
                  className="fi-btn-secondary"
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
                {columnsOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-line bg-surface p-3 shadow-lg shadow-ink/5">
                    <p className="fi-eyebrow px-1 pb-2">Show / hide columns</p>
                    <div className="max-h-64 space-y-0.5 overflow-auto pr-1">
                      {COLUMNS.map((c) => (
                        <label
                          key={c.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-ink hover:bg-paper"
                        >
                          <input
                            type="checkbox"
                            checked={visible.includes(c.id)}
                            onChange={() => toggleColumn(c.id)}
                            className="h-4 w-4 rounded border-line-strong text-signal"
                          />
                          {c.label}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={resetColumns}
                      className="fi-btn-ghost mt-2 w-full justify-center text-xs"
                    >
                      Reset to defaults
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="flex rounded-lg border border-line bg-paper p-0.5" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={view === "cards"}
              onClick={() => viewStore.set("cards")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "cards"
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
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
                  d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122"
                />
              </svg>
              Cards
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "table"}
              onClick={() => viewStore.set("table")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "table"
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
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
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
                />
              </svg>
              Table
            </button>
          </div>
        </div>
      </div>

      {view === "cards" ? (
        <CardsView
          rows={rows}
          hasConnections={hasConnections}
          busyId={busyId}
          errors={errors}
          onStatusChange={onStatusChange}
        />
      ) : (
        <TableView
          rows={rows}
          visible={visible}
          wrap={wrap}
          hasConnections={hasConnections}
          busyId={busyId}
          errors={errors}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
}