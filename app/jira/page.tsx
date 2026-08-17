import EmptyState from "@/components/EmptyState";
import { supabase } from "@/lib/supabase";

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
  const { data } = await supabase
    .from("jira_tickets")
    .select("*, feedback(title)")
    .order("created_at", { ascending: false });

  const tickets = (data ?? []) as unknown as DbTicket[];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Jira
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Jira tickets created from approved feedback.
      </p>

      <div className="mt-6">
        {tickets.length === 0 ? (
          <EmptyState
            title="No Jira tickets yet"
            description="Approve feedback and create a ticket from the review screen. Tickets will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Summary</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sprint</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-zinc-100 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      {t.ticket_url ? (
                        <a
                          href={t.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {t.ticket_key}
                        </a>
                      ) : (
                        <span className="font-medium text-zinc-900">
                          {t.ticket_key}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[320px] truncate px-4 py-3 text-zinc-700">
                      {t.feedback?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {t.status ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {t.sprint ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {t.assignee ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
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