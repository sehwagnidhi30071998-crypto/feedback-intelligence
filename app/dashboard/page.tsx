import Link from "next/link";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        An overview of your feedback pipeline.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Feedback" value={0} accent="indigo" />
        <StatCard label="Pending Review" value={0} accent="amber" />
        <StatCard label="Approved Feedback" value={0} accent="emerald" />
        <StatCard label="Jira Tickets" value={0} accent="blue" />
      </div>

      <div className="mt-8">
        <EmptyState
          title="No data yet"
          description="Add a meeting and analyze its transcript to start extracting feedback items."
          action={
            <Link
              href="/meetings/new"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Add your first meeting
            </Link>
          }
        />
      </div>
    </div>
  );
}