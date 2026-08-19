"use client";

import { useState, useTransition } from "react";
import { syncJiraTicketAction } from "@/lib/actions";

export type JiraTicketRow = {
  id: string;
  ticket_key: string;
  ticket_url: string | null;
  status: string | null;
  sprint: string | null;
  assignee: string | null;
  created_at: string;
  feedback_title: string | null;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function JiraTicketsTable({ tickets }: { tickets: JiraTicketRow[] }) {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const busy = syncing !== null;

  const runOne = (id: string) => {
    setError(null);
    setSyncing(id);
    const formData = new FormData();
    formData.append("ticket_id", id);
    startTransition(async () => {
      const result = await syncJiraTicketAction(formData);
      if (!result.ok) setError(result.error);
      setSyncing(null);
    });
  };

  const runAll = () => {
    setError(null);
    setSyncing("__all__");
    const ids = tickets.map((t) => t.id);
    let i = 0;
    const next = () => {
      if (i >= ids.length) {
        setSyncing(null);
        return;
      }
      const formData = new FormData();
      formData.append("ticket_id", ids[i]);
      i += 1;
      startTransition(async () => {
        const result = await syncJiraTicketAction(formData);
        if (!result.ok) setError(result.error);
        next();
      });
    };
    next();
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runAll}
          disabled={busy}
          className="fi-btn-secondary"
        >
          {syncing === "__all__" ? "Syncing all…" : "Sync all from Jira"}
        </button>
        <p className="text-xs text-faint">
          Pulls the latest status, sprint, and assignee from Jira.
        </p>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>

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
              <th className="fi-th">
                <span className="sr-only">Sync</span>
              </th>
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
                  {t.feedback_title ?? "—"}
                </td>
                <td className="fi-td">{t.status ?? "—"}</td>
                <td className="fi-td font-mono text-xs">{t.sprint ?? "—"}</td>
                <td className="fi-td">{t.assignee ?? "—"}</td>
                <td className="fi-td font-mono text-xs text-faint">
                  {formatDate(t.created_at)}
                </td>
                <td className="fi-td text-right">
                  <button
                    type="button"
                    onClick={() => runOne(t.id)}
                    disabled={busy}
                    className="fi-btn-ghost text-xs"
                  >
                    {syncing === t.id ? "Syncing…" : "Sync"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}