import EmptyState from "@/components/EmptyState";

export default function JiraPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Jira
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Jira tickets created from approved feedback.
      </p>
      <div className="mt-6">
        <EmptyState
          title="No Jira tickets yet"
          description="Tickets will appear here after you approve feedback and create a ticket. The Jira connection will be added in a later step."
        />
      </div>
    </div>
  );
}