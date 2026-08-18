import { createClient } from "@/lib/supabase-server";
import FeedbackTable, { type FeedbackRow } from "@/components/FeedbackTable";

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
  searchParams: Promise<{ analyzed?: string; action?: string; created?: string }>;
}) {
  const { analyzed, action, created } = await searchParams;

  const supabase = await createClient();

  const { data } = await supabase
    .from("feedback")
    .select("*, jira_tickets(ticket_key, ticket_url, status, sprint, assignee)")
    .order("created_at", { ascending: false });

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
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Feedback
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Review and manage extracted feedback items. Show or hide columns to
        match your workflow.
      </p>

      {analyzed === "1" ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Analysis complete. Review the extracted feedback items below.
        </div>
      ) : null}

      {action === "approved" ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Feedback item approved — it is now ready for Jira ticket creation.
        </div>
      ) : null}

      {action === "rejected" ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Feedback item rejected. It will not proceed to Jira.
        </div>
      ) : null}

      {action === "duplicate" ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          Feedback item marked as duplicate. It will not proceed to Jira.
        </div>
      ) : null}

      {created === "1" ? (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Jira ticket created. See it in the Jira section or in your Jira
          project.
        </div>
      ) : null}

      <div className="mt-6">
        <FeedbackTable rows={rows} />
      </div>
    </div>
  );
}