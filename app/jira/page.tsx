import EmptyState from "@/components/EmptyState";
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function JiraPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jira_tickets")
    .select("*, feedback(title)")
    .order("created_at", { ascending: false });

  const tickets = (data ?? []) as unknown as DbTicket[];

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
          <div className="fi-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60">
                  <th className="fi-th">Ticket</th>
                  <th className="fi-th">Summary</th>
                  <th className="fi-th">Status</th>
                  <th className="fi-th">Sprint</th>
                  <th className="fi-th">Assignee</th>
                  <th className="fi-th">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-line last:border-b-0 hover:bg-paper/50"
                  >
                    <td className="fi-td">
                      {t.ticket_url ? (
                        <a
                          href={t.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="fi-link font-mono text-xs"
                        >
                          {t.ticket_key}
                        </a>
                      ) : (
                        <span className="font-mono text-xs font-medium text-ink">
                          {t.ticket_key}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[320px] truncate px-4 py-3 font-medium text-ink">
                      {t.feedback?.title ?? "—"}
                    </td>
                    <td className="fi-td">{t.status ?? "—"}</td>
                    <td className="fi-td font-mono text-xs">{t.sprint ?? "—"}</td>
                    <td className="fi-td">{t.assignee ?? "—"}</td>
                    <td className="fi-td font-mono text-xs text-faint">
                      {formatDate(t.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}