import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import FeedbackReviewForm, {
  type ReviewItem,
  type JiraConnectionOption,
} from "@/components/FeedbackReviewForm";

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

export default async function FeedbackReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feedback")
    .select("*, jira_tickets(ticket_key, ticket_url, status, sprint, assignee)")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const f = data as unknown as DbFeedback;

  const { data: connections } = await supabase
    .from("jira_connections")
    .select("id, name, site_url, project_key, issue_type")
    .order("created_at", { ascending: false });

  const jiraConnections: JiraConnectionOption[] = ((connections ?? []) as {
    id: string;
    name: string;
    site_url: string;
    project_key: string;
    issue_type: string;
  }[]).map((c) => ({
    id: c.id,
    name: c.name,
    siteUrl: c.site_url,
    projectKey: c.project_key,
    issueType: c.issue_type,
  }));

  const item: ReviewItem = {
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
    jiraConnections,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/feedback"
        className="fi-link inline-flex items-center gap-1 text-sm"
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
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
        Back to feedback
      </Link>

      <p className="fi-eyebrow mt-6">Pipeline · stage 2</p>
      <h1 className="fi-page-title mt-1">Review feedback item</h1>
      <p className="fi-page-sub">
        Edit any field, then save your changes or make a final review decision.
      </p>

      <div className="fi-card mt-6 p-6">
        <FeedbackReviewForm item={item} />
      </div>
    </div>
  );
}