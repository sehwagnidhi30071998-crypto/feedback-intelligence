"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateFeedback } from "@/lib/actions";
import {
  ALLOWED_TYPES,
  TICKET_SECTIONS,
  type TicketDraft,
} from "@/lib/constants";

export type JiraConnectionOption = {
  id: string;
  name: string;
  siteUrl: string;
  projectKey: string;
  issueType: string;
};

export type ReviewItem = {
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
  jiraConnections: JiraConnectionOption[];
};

const statusBadge: Record<string, string> = {
  pending: "bg-amber-soft text-amber",
  approved: "bg-ok-soft text-ok",
  rejected: "bg-danger-soft text-danger",
  duplicate: "bg-paper text-muted",
};

function computeIce(impact: string, ease: string, confidence: string): string {
  const i = Number(impact);
  const e = Number(ease);
  const c = Number(confidence);
  if (![i, e, c].every((v) => Number.isFinite(v)) || i <= 0 || e <= 0 || c <= 0) {
    return "";
  }
  return String(Math.round(i * e * (c / 10)));
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
      <span className="h-3.5 w-1 rounded-full bg-signal" aria-hidden />
      {children}
    </h2>
  );
}

function ReviewActions() {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState<string | null>(null);

  const pendingLabels: Record<string, string> = {
    save: "Saving…",
    approve: "Approving…",
    reject: "Rejecting…",
    duplicate: "Marking…",
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        name="action"
        value="save"
        onClick={() => setClicked("save")}
        disabled={pending}
        className="fi-btn-secondary"
      >
        {pending && clicked === "save" ? pendingLabels.save : "Save Changes"}
      </button>
      <button
        type="submit"
        name="action"
        value="approve"
        onClick={() => setClicked("approve")}
        disabled={pending}
        className="fi-btn-ok"
      >
        {pending && clicked === "approve" ? pendingLabels.approve : "Approve"}
      </button>
      <button
        type="submit"
        name="action"
        value="reject"
        onClick={() => setClicked("reject")}
        disabled={pending}
        className="fi-btn-danger"
      >
        {pending && clicked === "reject" ? pendingLabels.reject : "Reject"}
      </button>
      <button
        type="submit"
        name="action"
        value="duplicate"
        onClick={() => setClicked("duplicate")}
        disabled={pending}
        className="fi-btn-secondary"
      >
        {pending && clicked === "duplicate" ? pendingLabels.duplicate : "Duplicate"}
      </button>
    </div>
  );
}

function TicketBuilder({
  connections,
  draft,
}: {
  connections: JiraConnectionOption[];
  draft: TicketDraft | undefined;
}) {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState<string | null>(null);

  const sectionById = new Map(
    (draft?.sections ?? []).map((section) => [section.id, section.body])
  );

  return (
    <div className="space-y-4 rounded-xl border border-line bg-paper/40 p-4">
      <div>
        <label className="fi-label" htmlFor="connection_id">
          Jira workspace
        </label>
        <select
          id="connection_id"
          name="connection_id"
          defaultValue={connections[0].id}
          className="fi-input"
        >
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.projectKey} ({c.siteUrl.replace(/^https?:\/\//, "")})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="fi-label" htmlFor="ticket_context">
          Additional context{" "}
          <span className="font-normal text-faint">(optional, guides the AI)</span>
        </label>
        <textarea
          id="ticket_context"
          name="ticket_context"
          rows={3}
          placeholder="Anything the engineers should know — who is affected, constraints, deadlines, links, how it surfaced…"
          className="fi-input"
        />
        <p className="mt-1 text-xs text-faint">
          Passed to the AI as guidance and included in the ticket, so everything
          stays in one place.
        </p>
      </div>

      {draft ? (
        <div key={JSON.stringify(draft)} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="fi-eyebrow">AI-generated draft — review and edit</p>
            <button
              type="submit"
              name="action"
              value="generate"
              onClick={() => setClicked("generate")}
              disabled={pending}
              className="fi-btn-ghost border border-line-strong"
            >
              {pending && clicked === "generate"
                ? "Regenerating…"
                : "Regenerate with AI"}
            </button>
          </div>

          <div>
            <label className="fi-label" htmlFor="draft_summary">
              Ticket summary
            </label>
            <input
              id="draft_summary"
              name="draft_summary"
              type="text"
              defaultValue={draft.summary}
              className="fi-input"
            />
          </div>

          {TICKET_SECTIONS.map((section) => {
            const body = sectionById.get(section.id) ?? "";
            if (!body) return null;
            return (
              <div key={section.id}>
                <label className="fi-label" htmlFor={`draft_${section.id}`}>
                  {section.heading}
                </label>
                <textarea
                  id={`draft_${section.id}`}
                  name={`draft_${section.id}`}
                  rows={section.format === "list" ? 5 : 3}
                  defaultValue={body}
                  className="fi-input"
                />
              </div>
            );
          })}

          <button
            type="submit"
            name="action"
            value="jira"
            onClick={() => setClicked("jira")}
            disabled={pending}
            className="fi-btn-primary w-full justify-center"
          >
            {pending && clicked === "jira"
              ? "Creating ticket…"
              : "Create Jira ticket"}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          name="action"
          value="generate"
          onClick={() => setClicked("generate")}
          disabled={pending}
          className="fi-btn-primary w-full justify-center"
        >
          {pending && clicked === "generate"
            ? "Generating draft…"
            : "Generate ticket draft with AI"}
        </button>
      )}
    </div>
  );
}

export default function FeedbackReviewForm({ item }: { item: ReviewItem }) {
  const [state, formAction] = useActionState(
    updateFeedback.bind(null, item.id),
    {}
  );

  const [impact, setImpact] = useState(item.impact?.toString() ?? "");
  const [ease, setEase] = useState(item.ease?.toString() ?? "");
  const [confidence, setConfidence] = useState(
    item.confidence?.toString() ?? ""
  );
  const [ice, setIce] = useState(item.iceScore?.toString() ?? "");

  const onImpact = (value: string) => {
    setImpact(value);
    setIce(computeIce(value, ease, confidence));
  };
  const onEase = (value: string) => {
    setEase(value);
    setIce(computeIce(impact, value, confidence));
  };
  const onConfidence = (value: string) => {
    setConfidence(value);
    setIce(computeIce(impact, ease, value));
  };

  const status = item.reviewStatus.toLowerCase();
  const dateValue = item.reportedDate ? String(item.reportedDate).slice(0, 10) : "";

  let jiraNote;
  if (item.jiraTicket) {
    jiraNote = (
      <div className="fi-notice border-signal-soft bg-signal-soft text-ink">
        <span className="text-signal-strong">Linked Jira ticket:</span>{" "}
        {item.jiraUrl ? (
          <a
            href={item.jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fi-link font-mono text-xs"
          >
            {item.jiraTicket}
          </a>
        ) : (
          <span className="font-mono text-xs font-medium">{item.jiraTicket}</span>
        )}
        {item.jiraStatus ? ` · ${item.jiraStatus}` : ""}
        {item.sprint ? ` · Sprint: ${item.sprint}` : ""}
        {item.assignee ? ` · ${item.assignee}` : ""}
      </div>
    );
  } else if (status === "approved") {
    jiraNote =
      item.jiraConnections.length > 0 ? (
        <div className="fi-notice border-ok-soft bg-ok-soft text-ok">
          Approved — this item is ready. Generate an AI ticket draft below,
          review and edit it, then create the Jira ticket.
        </div>
      ) : (
        <div className="fi-notice border-amber-soft bg-amber-soft text-amber">
          Approved — but you have no Jira workspaces connected yet.{" "}
          <Link href="/settings" className="font-medium underline">
            Connect your Jira workspace
          </Link>{" "}
          to create tickets from approved feedback.
        </div>
      );
  } else if (status === "pending") {
    jiraNote = (
      <div className="fi-notice border-amber-soft bg-amber-soft text-amber">
        This item must be approved before it can proceed to Jira.
      </div>
    );
  } else {
    jiraNote = (
      <div className="fi-notice border-line bg-paper text-muted">
        This item cannot proceed to Jira because it was rejected or marked as
        duplicate.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      {state.error ? (
        <div className="fi-notice border-danger-soft bg-danger-soft text-danger">
          {state.error}
        </div>
      ) : null}
      {state.saved ? (
        <div className="fi-notice border-ok-soft bg-ok-soft text-ok">
          Changes saved.
        </div>
      ) : null}

      <section className="space-y-4">
        <SectionHeading>Core information</SectionHeading>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="fi-label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={item.title}
              className="fi-input"
            />
          </div>
          <div>
            <label className="fi-label" htmlFor="type">
              Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={item.type ?? ""}
              className="fi-input"
            >
              <option value="">—</option>
              {ALLOWED_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="fi-label" htmlFor="reported_date">
              Reported date
            </label>
            <input
              id="reported_date"
              name="reported_date"
              type="date"
              defaultValue={dateValue}
              className="fi-input"
            />
          </div>
          <div>
            <label className="fi-label" htmlFor="reporter">
              Reporter
            </label>
            <input
              id="reporter"
              name="reporter"
              type="text"
              defaultValue={item.reporter ?? ""}
              className="fi-input"
            />
          </div>
          <div>
            <label className="fi-label" htmlFor="reporter_team">
              Reporter team
            </label>
            <input
              id="reporter_team"
              name="reporter_team"
              type="text"
              defaultValue={item.reporterTeam ?? ""}
              className="fi-input"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading>Description</SectionHeading>
        <div>
          <label className="fi-label" htmlFor="problem">
            Problem
          </label>
          <textarea
            id="problem"
            name="problem"
            rows={2}
            defaultValue={item.problem ?? ""}
            className="fi-input"
          />
        </div>
        <div>
          <label className="fi-label" htmlFor="requested_change">
            Requested change
          </label>
          <textarea
            id="requested_change"
            name="requested_change"
            rows={2}
            defaultValue={item.requestedChange ?? ""}
            className="fi-input"
          />
        </div>
        <div>
          <label className="fi-label" htmlFor="proposed_implementation">
            Proposed implementation
          </label>
          <textarea
            id="proposed_implementation"
            name="proposed_implementation"
            rows={2}
            defaultValue={item.proposedImplementation ?? ""}
            className="fi-input"
          />
        </div>
        <div>
          <label className="fi-label" htmlFor="domain_knowledge">
            Domain knowledge
          </label>
          <textarea
            id="domain_knowledge"
            name="domain_knowledge"
            rows={2}
            defaultValue={item.domainKnowledge ?? ""}
            className="fi-input"
          />
        </div>
        <div>
          <label className="fi-label" htmlFor="transcript_evidence">
            Transcript evidence
          </label>
          <textarea
            id="transcript_evidence"
            name="transcript_evidence"
            rows={3}
            defaultValue={item.transcriptEvidence ?? ""}
            className="fi-input font-mono text-xs leading-relaxed"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading>Scoring</SectionHeading>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className="fi-label" htmlFor="confidence">
              Confidence (0–100)
            </label>
            <input
              id="confidence"
              name="confidence"
              type="number"
              min={0}
              max={100}
              value={confidence}
              onChange={(e) => onConfidence(e.target.value)}
              className="fi-input"
            />
          </div>
          <div>
            <label className="fi-label" htmlFor="impact">
              Impact (1–10)
            </label>
            <input
              id="impact"
              name="impact"
              type="number"
              min={1}
              max={10}
              value={impact}
              onChange={(e) => onImpact(e.target.value)}
              className="fi-input"
            />
          </div>
          <div>
            <label className="fi-label" htmlFor="ease">
              Ease (1–10)
            </label>
            <input
              id="ease"
              name="ease"
              type="number"
              min={1}
              max={10}
              value={ease}
              onChange={(e) => onEase(e.target.value)}
              className="fi-input"
            />
          </div>
          <div>
            <label className="fi-label" htmlFor="ice_score">
              ICE score
            </label>
            <input
              id="ice_score"
              name="ice_score"
              type="number"
              min={0}
              max={1000}
              value={ice}
              onChange={(e) => setIce(e.target.value)}
              className="fi-input"
            />
            <p className="mt-1 text-xs text-faint">
              Impact × ease × (confidence / 10)
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeading>Review</SectionHeading>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ink">Status:</span>
          <span
            className={`fi-badge capitalize ${
              statusBadge[status] ?? "bg-paper text-muted"
            }`}
          >
            {status}
          </span>
        </div>
        {jiraNote}
        {status === "approved" && !item.jiraTicket && item.jiraConnections.length > 0 ? (
          <TicketBuilder connections={item.jiraConnections} draft={state.draft} />
        ) : null}
        <ReviewActions />
        <p className="text-xs text-faint">
          Approve, Reject, or Duplicate also saves your edits. Only approved
          feedback can proceed to Jira.
        </p>
      </section>
    </form>
  );
}