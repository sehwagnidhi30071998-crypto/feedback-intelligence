import Link from "next/link";
import { Suspense } from "react";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import Tour from "@/components/Tour";
import { Waveform } from "@/components/Wordmark";
import { createClient } from "@/lib/supabase-server";

const stages = [
  {
    key: "listen",
    label: "Add transcript",
    verb: "Save & analyze transcripts",
    href: "/meetings",
    accent: "text-signal bg-signal-soft",
  },
  {
    key: "review",
    label: "Review extracted feedback",
    verb: "Triage the extracted items",
    href: "/feedback",
    accent: "text-amber bg-amber-soft",
  },
  {
    key: "ship",
    label: "Create Jira tickets",
    verb: "Track approved items in Jira",
    href: "/jira",
    accent: "text-ok bg-ok-soft",
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const [meetingsRes, totalRes, pendingRes, approvedRes, jiraRes] =
    await Promise.all([
      supabase.from("meetings").select("*", { count: "exact", head: true }),
      supabase.from("feedback").select("*", { count: "exact", head: true }),
      supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("review_status", "pending"),
      supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("review_status", "approved"),
      supabase.from("jira_tickets").select("*", { count: "exact", head: true }),
    ]);

  const meetings = meetingsRes.count ?? 0;
  const total = totalRes.count ?? 0;
  const pending = pendingRes.count ?? 0;
  const approved = approvedRes.count ?? 0;
  const jira = jiraRes.count ?? 0;

  const stageCounts = {
    listen: meetings,
    review: total,
    ship: jira,
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <p className="fi-eyebrow">Signal overview</p>
      <h1 className="fi-page-title mt-1">Your feedback pipeline</h1>
      <p className="fi-page-sub">
        From raw conversation to tracked work — see where things stand at each
        stage.
      </p>

      <section aria-label="Pipeline stages" id="tour-pipeline" className="mt-8">
        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {stages.map((stage, i) => (
            <div key={stage.key} className="contents">
              <Link
                href={stage.href}
                id={`tour-stage-${stage.key}`}
                className="fi-card group flex flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${stage.accent}`}
                  >
                    <Waveform
                      active
                      className={`h-4 w-4 ${stage.accent.split(" ")[0]}`}
                    />
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted">{stage.verb}</p>
                  <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">
                    {stageCounts[stage.key]}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {stage.label}
                  </p>
                </div>
              </Link>
              {i < stages.length - 1 ? (
                <div className="hidden items-center md:flex" aria-hidden>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5 text-line-strong"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Pipeline metrics" className="mt-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total feedback" value={total} accent="signal" />
          <StatCard label="Pending review" value={pending} accent="amber" />
          <StatCard label="Approved feedback" value={approved} accent="ok" />
          <StatCard label="Jira tickets" value={jira} accent="muted" />
        </div>
      </section>

      {total === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No signal yet"
            description="Add a meeting and analyze its transcript to start extracting feedback items."
            action={
              <Link href="/meetings/new" className="fi-btn-primary">
                Add your first meeting
              </Link>
            }
          />
        </div>
      ) : null}

      <Suspense fallback={null}>
        <Tour />
      </Suspense>
    </div>
  );
}