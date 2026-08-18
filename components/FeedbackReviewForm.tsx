"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateFeedback } from "@/lib/actions";
import { ALLOWED_TYPES } from "@/lib/constants";

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

const inputClasses =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const labelClasses = "block text-sm font-medium text-zinc-700";

const statusBadge: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  duplicate: "bg-zinc-100 text-zinc-600",
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

function ReviewActions({
  canCreateJira,
}: {
  canCreateJira: boolean;
}) {
  const { pending } = useFormStatus();
  const [clicked, setClicked] = useState<string | null>(null);

  const pendingLabels: Record<string, string> = {
    save: "Saving…",
    approve: "Approving…",
    reject: "Rejecting…",
    duplicate: "Marking…",
    jira: "Creating ticket…",
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canCreateJira ? (
        <button
          type="submit"
          name="action"
          value="jira"
          onClick={() => setClicked("jira")}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && clicked === "jira" ? pendingLabels.jira : "Create Jira Ticket"}
        </button>
      ) : null}
      <button
        type="submit"
        name="action"
        value="save"
        onClick={() => setClicked("save")}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && clicked === "save" ? pendingLabels.save : "Save Changes"}
      </button>
      <button
        type="submit"
        name="action"
        value="approve"
        onClick={() => setClicked("approve")}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && clicked === "approve" ? pendingLabels.approve : "Approve"}
      </button>
      <button
        type="submit"
        name="action"
        value="reject"
        onClick={() => setClicked("reject")}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && clicked === "reject" ? pendingLabels.reject : "Reject"}
      </button>
      <button
        type="submit"
        name="action"
        value="duplicate"
        onClick={() => setClicked("duplicate")}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && clicked === "duplicate" ? pendingLabels.duplicate : "Duplicate"}
      </button>
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
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        Linked Jira ticket:{" "}
        {item.jiraUrl ? (
          <a
            href={item.jiraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:underline"
          >
            {item.jiraTicket}
          </a>
        ) : (
          <span className="font-medium">{item.jiraTicket}</span>
        )}
        {item.jiraStatus ? ` · ${item.jiraStatus}` : ""}
        {item.sprint ? ` · Sprint: ${item.sprint}` : ""}
        {item.assignee ? ` · ${item.assignee}` : ""}
      </div>
    );
  } else if (status === "approved") {
    jiraNote =
      item.jiraConnections.length > 0 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Approved — this item is ready. Choose a Jira workspace and create the
          ticket below.
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Approved — but you have no Jira workspaces connected yet.{" "}
          <Link href="/settings" className="font-medium underline">
            Connect your Jira workspace
          </Link>{" "}
          to create tickets from approved feedback.
        </div>
      );
  } else if (status === "pending") {
    jiraNote = (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        This item must be approved before it can proceed to Jira.
      </div>
    );
  } else {
    jiraNote = (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        This item cannot proceed to Jira because it was rejected or marked as
        duplicate.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state.saved ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Changes saved.
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Core information
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={labelClasses} htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={item.title}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses} htmlFor="type">
              Type
            </label>
            <select
              id="type"
              name="type"
              defaultValue={item.type ?? ""}
              className={inputClasses}
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
            <label className={labelClasses} htmlFor="reported_date">
              Reported date
            </label>
            <input
              id="reported_date"
              name="reported_date"
              type="date"
              defaultValue={dateValue}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses} htmlFor="reporter">
              Reporter
            </label>
            <input
              id="reporter"
              name="reporter"
              type="text"
              defaultValue={item.reporter ?? ""}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses} htmlFor="reporter_team">
              Reporter team
            </label>
            <input
              id="reporter_team"
              name="reporter_team"
              type="text"
              defaultValue={item.reporterTeam ?? ""}
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Description
        </h2>
        <div>
          <label className={labelClasses} htmlFor="problem">
            Problem
          </label>
          <textarea
            id="problem"
            name="problem"
            rows={2}
            defaultValue={item.problem ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses} htmlFor="requested_change">
            Requested change
          </label>
          <textarea
            id="requested_change"
            name="requested_change"
            rows={2}
            defaultValue={item.requestedChange ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses} htmlFor="proposed_implementation">
            Proposed implementation
          </label>
          <textarea
            id="proposed_implementation"
            name="proposed_implementation"
            rows={2}
            defaultValue={item.proposedImplementation ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses} htmlFor="domain_knowledge">
            Domain knowledge
          </label>
          <textarea
            id="domain_knowledge"
            name="domain_knowledge"
            rows={2}
            defaultValue={item.domainKnowledge ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses} htmlFor="transcript_evidence">
            Transcript evidence
          </label>
          <textarea
            id="transcript_evidence"
            name="transcript_evidence"
            rows={3}
            defaultValue={item.transcriptEvidence ?? ""}
            className={`${inputClasses} font-mono text-xs`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Scoring
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <label className={labelClasses} htmlFor="confidence">
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
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses} htmlFor="impact">
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
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses} htmlFor="ease">
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
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses} htmlFor="ice_score">
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
              className={inputClasses}
            />
            <p className="mt-1 text-xs text-zinc-400">
              Impact × ease × (confidence / 10)
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Review
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-700">Status:</span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
              statusBadge[status] ?? "bg-zinc-100 text-zinc-600"
            }`}
          >
            {status}
          </span>
        </div>
        {jiraNote}
        {status === "approved" && !item.jiraTicket && item.jiraConnections.length > 0 ? (
          <div>
            <label className={labelClasses} htmlFor="connection_id">
              Jira workspace
            </label>
            <select
              id="connection_id"
              name="connection_id"
              defaultValue={item.jiraConnections[0].id}
              className={inputClasses}
            >
              {item.jiraConnections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.projectKey} ({c.siteUrl.replace(/^https?:\/\//, "")})
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <ReviewActions
          canCreateJira={
            status === "approved" &&
            !item.jiraTicket &&
            item.jiraConnections.length > 0
          }
        />
        <p className="text-xs text-zinc-400">
          Approve, Reject, or Duplicate also saves your edits. Only approved
          feedback can proceed to Jira.
        </p>
      </section>
    </form>
  );
}