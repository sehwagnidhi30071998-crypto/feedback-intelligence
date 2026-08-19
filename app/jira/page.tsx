import EmptyState from "@/components/EmptyState";
import JiraTicketsTable, {
  type JiraTicketRow,
} from "@/components/JiraTicketsTable";
import { createClient } from "@/lib/supabase-server";

type DbTicket = {
  id: string;
  ticket_key: string;
  ticket_url: string | null;
  status: string | null;
  sprint: string | null;
  assignee: string | null;
  created_at: string;
  feedback: { title: string } | null;
};

export default async function JiraPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jira_tickets")
    .select("*, feedback(title)")
    .order("created_at", { ascending: false });

  const dbTickets = (data ?? []) as unknown as DbTicket[];

  const tickets: JiraTicketRow[] = dbTickets.map((t) => ({
    id: t.id,
    ticket_key: t.ticket_key,
    ticket_url: t.ticket_url,
    status: t.status,
    sprint: t.sprint,
    assignee: t.assignee,
    created_at: t.created_at,
    feedback_title: t.feedback?.title ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <p className="fi-eyebrow">Pipeline · stage 3</p>
      <h1 className="fi-page-title mt-1">Create Jira tickets</h1>
      <p className="fi-page-sub">
        Jira tickets created from approved feedback.
      </p>

      <div className="mt-6">
        {tickets.length === 0 ? (
          <EmptyState
            title="No Jira tickets yet"
            description="Approve feedback and create a ticket from the review screen. Tickets will appear here."
          />
        ) : (
          <JiraTicketsTable tickets={tickets} />
        )}
      </div>
    </div>
  );
}