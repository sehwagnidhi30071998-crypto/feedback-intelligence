import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import FeedbackView, { type FeedbackRow } from "@/components/FeedbackView";
import { noindex } from "@/lib/seo";

export const metadata: Metadata = {
  ...noindex,
  title: "Review extracted feedback",
};

type DbFeedback = {
  id: string;
  title: string;
  type: string | null;
  reporter: string | null;
  reporter_team: string | null;
  reported_date: string | null;
  problem: string | null;
  requested_change: string | null;
  proposed_implementation: string | null;
  domain_knowledge: string | null;
  transcript_evidence: string | null;
  confidence: number | null;
  impact: number | null;
  ease: number | null;
  ice_score: number | null;
  review_status: string;
  jira_tickets?: {
    ticket_key: string | null;
    ticket_url: string | null;
    status: string | null;
    sprint: string | null;
    assignee: string | null;
  }[];
};

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    analyzed?: string;
    action?: string;
    created?: string;
    meeting?: string;
  }>;
}) {
  const { analyzed, action, created, meeting } = await searchParams;

  const supabase = await createClient();

  let query = supabase
    .from("feedback")
    .select("*, jira_tickets(ticket_key, ticket_url, status, sprint, assignee)")
    .order("created_at", { ascending: false });

  if (meeting) {
    query = query.eq("meeting_id", meeting);
  }

  const { data } = await query;

  let meetingTitle: string | null = null;
  if (meeting) {
    const { data: m } = await supabase
      .from("meetings")
      .select("title")
      .eq("id", meeting)
      .single();
    meetingTitle = m?.title ?? null;
  }

  const { count } = await supabase
    .from("jira_connections")
    .select("id", { count: "exact", head: true });
  const hasConnections = (count ?? 0) > 0;

  const rows: FeedbackRow[] = ((data ?? []) as unknown as DbFeedback[]).map(
    (f) => ({
      id: f.id,
      title: f.title,
      type: f.type,
      reporter: f.reporter,
      reporterTeam: f.reporter_team,
      reportedDate: f.reported_date,
      problem: f.problem,
      requestedChange: f.requested_change,
      proposedImplementation: f.proposed_implementation,
      domainKnowledge: f.domain_knowledge,
      transcriptEvidence: f.transcript_evidence,
      confidence: f.confidence,
      impact: f.impact,
      ease: f.ease,
      iceScore: f.ice_score,
      reviewStatus: f.review_status,
      jiraTicket: f.jira_tickets?.[0]?.ticket_key ?? null,
      jiraUrl: f.jira_tickets?.[0]?.ticket_url ?? null,
      jiraStatus: f.jira_tickets?.[0]?.status ?? null,
      sprint: f.jira_tickets?.[0]?.sprint ?? null,
      assignee: f.jira_tickets?.[0]?.assignee ?? null,
    })
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <p className="fi-eyebrow">Pipeline · stage 2</p>
      <h1 className="fi-page-title mt-1">Review extracted feedback</h1>
      <p className="fi-page-sub">
        Everything is visible — change a status from the list or open Review to
        edit an item in detail.
      </p>

      {meetingTitle ? (
        <div className="fi-notice mt-6 flex flex-wrap items-center justify-between gap-3 border-signal-soft bg-signal-soft text-signal-strong">
          <span>
            Showing feedback extracted from{" "}
            <span className="font-medium">“{meetingTitle}”</span>.
          </span>
          <Link href="/feedback" className="fi-link text-sm">
            View all feedback
          </Link>
        </div>
      ) : null}

      {analyzed === "1" ? (
        <div className="fi-notice mt-6 border-ok-soft bg-ok-soft text-ok">
          Analysis complete. Review the extracted feedback items below.
        </div>
      ) : null}

      {action === "approved" ? (
        <div className="fi-notice mt-6 border-ok-soft bg-ok-soft text-ok">
          Feedback item approved — it is now ready for Jira ticket creation.
        </div>
      ) : null}

      {action === "rejected" ? (
        <div className="fi-notice mt-6 border-danger-soft bg-danger-soft text-danger">
          Feedback item rejected. It will not proceed to Jira.
        </div>
      ) : null}

      {action === "duplicate" ? (
        <div className="fi-notice mt-6 border-line bg-paper text-muted">
          Feedback item marked as duplicate. It will not proceed to Jira.
        </div>
      ) : null}

      {created === "1" ? (
        <div className="fi-notice mt-6 border-signal-soft bg-signal-soft text-signal-strong">
          Jira ticket created. See it in the Jira section or in your Jira
          project.
        </div>
      ) : null}

      <div className="mt-6">
        {rows.length === 0 ? (
          <div className="fi-card flex flex-col items-center justify-center px-6 py-16 text-center">
            <h2 className="font-display text-lg font-semibold text-ink">
              No feedback items here yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Feedback items appear after you analyze a transcript. If this
              list is filtered by a meeting, that transcript may not have
              produced any items.
            </p>
          </div>
        ) : (
          <FeedbackView rows={rows} hasConnections={hasConnections} />
        )}
      </div>
    </div>
  );
}