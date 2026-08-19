"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { setFeedbackStatus } from "@/lib/actions";
import { REVIEW_STATUSES } from "@/lib/constants";

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

const STATUS_CHOICES = ["pending", "approved", "rejected", "duplicate"];

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

type SortField =
  | "iceScore"
  | "confidence"
  | "impact"
  | "ease"
  | "reportedDate"
  | "title"
  | "type"
  | "reviewStatus"
  | "reporter"
  | "jiraTicket"
  | "jiraStatus";

type SortState = { field: SortField; dir: "asc" | "desc" };

type Filters = { type: string; reviewStatus: string; hasTicket: string };

type FilterOption = { value: string; label: string };

const SORT_FIELDS: { id: SortField; label: string }[] = [
  { id: "iceScore", label: "ICE score" },
  { id: "confidence", label: "Confidence" },
  { id: "impact", label: "Impact" },
  { id: "ease", label: "Ease" },
  { id: "reportedDate", label: "Reported date" },
  { id: "title", label: "Title" },
  { id: "type", label: "Type" },
  { id: "reviewStatus", label: "Review status" },
  { id: "reporter", label: "Reporter" },
  { id: "jiraTicket", label: "Jira ticket" },
  { id: "jiraStatus", label: "Jira status" },
];

const NUMERIC_FIELDS = new Set<SortField>([
  "iceScore",
  "confidence",
  "impact",
  "ease",
]);

const SORTABLE_IDS = new Set<ColumnId>(SORT_FIELDS.map((f) => f.id));

const DEFAULT_SORT: SortState = { field: "iceScore", dir: "desc" };
const DEFAULT_FILTERS: Filters = { type: "", reviewStatus: "", hasTicket: "" };

const sortStore = makeStore<SortState>(DEFAULT_SORT, "fi-feedback-sort", (raw) => {
  try {
    const p = JSON.parse(raw) as Partial<SortState>;
    if (
      p &&
      typeof p.field === "string" &&
      SORT_FIELDS.some((f) => f.id === p.field) &&
      (p.dir === "asc" || p.dir === "desc")
    ) {
      return { field: p.field as SortField, dir: p.dir };
    }
    return DEFAULT_SORT;
  } catch {
    return DEFAULT_SORT;
  }
});

const filtersStore = makeStore<Filters>(
  DEFAULT_FILTERS,
  "fi-feedback-filters",
  (raw) => {
    try {
      const p = JSON.parse(raw) as Partial<Filters>;
      return {
        type: typeof p.type === "string" ? p.type : "",
        reviewStatus: typeof p.reviewStatus === "string" ? p.reviewStatus : "",
        hasTicket: typeof p.hasTicket === "string" ? p.hasTicket : "",
      };
    } catch {
      return DEFAULT_FILTERS;
    }
  }
);

function sortValue(row: FeedbackRow, field: SortField): number | string | null {
  switch (field) {
    case "iceScore":
      return row.iceScore;
    case "confidence":
      return row.confidence;
    case "impact":
      return row.impact;
    case "ease":
      return row.ease;
    case "reportedDate":
      return row.reportedDate;
    case "title":
      return row.title;
    case "type":
      return row.type;
    case "reviewStatus":
      return row.reviewStatus;
    case "reporter":
      return row.reporter;
    case "jiraTicket":
      return row.jiraTicket;
    case "jiraStatus":
      return row.jiraStatus;
  }
}

function nextSort(prev: SortState, field: SortField): SortState {
  if (prev.field === field) {
    return { field, dir: prev.dir === "desc" ? "asc" : "desc" };
  }
  return { field, dir: NUMERIC_FIELDS.has(field) ? "desc" : "asc" };
}

function IconBase({
  d,
  className = "h-4 w-4",
}: {
  d: string;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const ARROW_UP_DOWN =
  "M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5";
const CHEVRON_UP = "m4.5 15.75 7.5-7.5 7.5 7.5";
const CHEVRON_DOWN = "m19.5 8.25-7.5 7.5-7.5-7.5";
const FUNNEL =
  "M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z";
const CHECK = "m4.5 12.75 6 6 9-13.5";

function SortMenu({
  sort,
  onChange,
}: {
  sort: SortState;
  onChange: (sort: SortState) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeLabel =
    SORT_FIELDS.find((f) => f.id === sort.field)?.label ?? SORT_FIELDS[0].label;

  return (
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
        className="fi-btn-secondary"
      >
        <IconBase d={ARROW_UP_DOWN} />
        <span>Sort: {activeLabel}</span>
        <IconBase d={sort.dir === "desc" ? CHEVRON_DOWN : CHEVRON_UP} className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-line bg-surface p-1.5 shadow-lg shadow-ink/5">
          <p className="fi-eyebrow px-2 pb-1">Sort by</p>
          <div className="max-h-72 overflow-auto">
            {SORT_FIELDS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  onChange(nextSort(sort, f.id));
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                  f.id === sort.field
                    ? "bg-signal-soft font-medium text-signal-strong"
                    : "text-ink hover:bg-paper"
                }`}
              >
                {f.label}
                {f.id === sort.field ? (
                  <IconBase
                    d={sort.dir === "desc" ? CHEVRON_DOWN : CHEVRON_UP}
                    className="h-4 w-4"
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterMenu({
  label,
  options,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const activeLabel = options.find((o) => o.value === value)?.label;
  const active = value !== "";

  return (
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
        aria-pressed={open}
        title={compact ? `Filter by ${label}` : undefined}
        className={
          compact
            ? `inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                active
                  ? "border-signal bg-signal-soft text-signal-strong"
                  : "border-line-strong bg-white text-faint hover:text-ink"
              }`
            : `fi-btn-secondary ${
                active ? "border-signal bg-signal-soft/60 text-signal-strong" : ""
              }`
        }
      >
        <IconBase d={FUNNEL} className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {compact ? null : (
          <span className="capitalize">{active ? activeLabel ?? label : label}</span>
        )}
      </button>
      {open ? (
        <div
          className={`absolute right-0 z-20 mt-2 rounded-xl border border-line bg-surface p-1.5 shadow-lg shadow-ink/5 ${
            compact ? "w-48" : "w-56"
          }`}
        >
          <p className="fi-eyebrow px-2 pb-1">{label}</p>
          <div className="max-h-64 overflow-auto">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                  o.value === value
                    ? "bg-signal-soft font-medium text-signal-strong"
                    : "text-ink hover:bg-paper"
                }`}
              >
                <span className="capitalize">{o.label}</span>
                {o.value === value ? <IconBase d={CHECK} className="h-4 w-4" /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
      {STATUS_CHOICES.map((s) => (
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
  sort,
  onToggleSort,
  filters,
  typeOptions,
  statusOptions,
  onFilter,
}: {
  rows: FeedbackRow[];
  visible: ColumnId[];
  wrap: boolean;
  hasConnections: boolean;
  busyId: string | null;
  errors: Record<string, string>;
  onStatusChange: (id: string, status: string) => void;
  sort: SortState;
  onToggleSort: (id: ColumnId) => void;
  filters: Filters;
  typeOptions: FilterOption[];
  statusOptions: FilterOption[];
  onFilter: (key: keyof Filters, value: string) => void;
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
              {visibleColumns.map((c) => {
                const sortable = SORTABLE_IDS.has(c.id);
                const active = sort.field === c.id;
                return (
                  <th key={c.id} className="fi-th relative">
                    <div className="flex items-center gap-1">
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => onToggleSort(c.id)}
                          title={`Sort by ${c.label}`}
                          className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${
                            active ? "text-signal-strong" : ""
                          }`}
                        >
                          {c.label}
                          {active ? (
                            <IconBase
                              d={sort.dir === "desc" ? CHEVRON_DOWN : CHEVRON_UP}
                              className="h-3 w-3"
                            />
                          ) : (
                            <IconBase d={ARROW_UP_DOWN} className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <span>{c.label}</span>
                      )}
                      {c.id === "type" ? (
                        <FilterMenu
                          compact
                          label="Type"
                          options={typeOptions}
                          value={filters.type}
                          onChange={(v) => onFilter("type", v)}
                        />
                      ) : null}
                      {c.id === "reviewStatus" ? (
                        <FilterMenu
                          compact
                          label="Review status"
                          options={statusOptions}
                          value={filters.reviewStatus}
                          onChange={(v) => onFilter("reviewStatus", v)}
                        />
                      ) : null}
                    </div>
                  </th>
                );
              })}
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
  const sort = useSyncExternalStore(
    sortStore.subscribe,
    sortStore.getSnapshot,
    sortStore.getServerSnapshot
  );
  const filters = useSyncExternalStore(
    filtersStore.subscribe,
    filtersStore.getSnapshot,
    filtersStore.getServerSnapshot
  );

  const typeOptions = useMemo<FilterOption[]>(() => {
    const types = Array.from(
      new Set(rows.map((r) => r.type).filter((t): t is string => Boolean(t)))
    ).sort();
    return [
      { value: "", label: "All types" },
      ...types.map((t) => ({ value: t, label: t })),
    ];
  }, [rows]);

  const statusFilterOptions = useMemo<FilterOption[]>(
    () => [
      { value: "", label: "All statuses" },
      ...REVIEW_STATUSES.map((s) => ({ value: s, label: s })),
    ],
    []
  );

  const ticketOptions: FilterOption[] = [
    { value: "", label: "All tickets" },
    { value: "has", label: "Has ticket" },
    { value: "none", label: "No ticket" },
  ];

  const filteredRows = useMemo(() => {
    let out = rows;
    if (filters.type) {
      out = out.filter((r) => r.type === filters.type);
    }
    if (filters.reviewStatus) {
      out = out.filter(
        (r) => r.reviewStatus.toLowerCase() === filters.reviewStatus
      );
    }
    if (filters.hasTicket === "has") {
      out = out.filter((r) => Boolean(r.jiraTicket));
    }
    if (filters.hasTicket === "none") {
      out = out.filter((r) => !r.jiraTicket);
    }
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...out].sort((a, b) => {
      const va = sortValue(a, sort.field);
      const vb = sortValue(b, sort.field);
      if (va === vb) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return (
        String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir
      );
    });
  }, [rows, sort, filters]);

  const hasFilters =
    filters.type !== "" || filters.reviewStatus !== "" || filters.hasTicket !== "";

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

  const toggleSort = (id: ColumnId) => {
    if (!SORTABLE_IDS.has(id)) return;
    sortStore.set(nextSort(sort, id as SortField));
  };

  const setFilter = (key: keyof Filters, value: string) => {
    filtersStore.set({ ...filters, [key]: value });
  };

  const clearFilters = () => filtersStore.set(DEFAULT_FILTERS);

  return (
    <div className="space-y-4">
      <div className="fi-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">
            Feedback items
          </h2>
          <p className="text-xs text-faint">
            {filteredRows.length} item{filteredRows.length === 1 ? "" : "s"}
            {hasFilters ? ` of ${rows.length}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {view === "cards" ? (
            <>
              <SortMenu
                sort={sort}
                onChange={(s) => sortStore.set(s)}
              />
              <FilterMenu
                label="Type"
                options={typeOptions}
                value={filters.type}
                onChange={(v) => setFilter("type", v)}
              />
              <FilterMenu
                label="Status"
                options={statusFilterOptions}
                value={filters.reviewStatus}
                onChange={(v) => setFilter("reviewStatus", v)}
              />
              <FilterMenu
                label="Ticket"
                options={ticketOptions}
                value={filters.hasTicket}
                onChange={(v) => setFilter("hasTicket", v)}
              />
            </>
          ) : null}

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="fi-btn-ghost border border-line-strong text-xs"
            >
              Clear filters
            </button>
          ) : null}

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

      {rows.length === 0 ? null : filteredRows.length === 0 ? (
        <div className="fi-card flex flex-col items-center justify-center px-6 py-12 text-center">
          <h2 className="font-display text-base font-semibold text-ink">
            No feedback matches the current filters
          </h2>
          <button
            type="button"
            onClick={clearFilters}
            className="fi-btn-secondary mt-4"
          >
            Clear filters
          </button>
        </div>
      ) : view === "cards" ? (
        <CardsView
          rows={filteredRows}
          hasConnections={hasConnections}
          busyId={busyId}
          errors={errors}
          onStatusChange={onStatusChange}
        />
      ) : (
        <TableView
          rows={filteredRows}
          visible={visible}
          wrap={wrap}
          hasConnections={hasConnections}
          busyId={busyId}
          errors={errors}
          onStatusChange={onStatusChange}
          sort={sort}
          onToggleSort={toggleSort}
          filters={filters}
          typeOptions={typeOptions}
          statusOptions={statusFilterOptions}
          onFilter={setFilter}
        />
      )}
    </div>
  );
}