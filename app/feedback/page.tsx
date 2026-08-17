import FeedbackTable from "@/components/FeedbackTable";

export default function FeedbackPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Feedback
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Review and manage extracted feedback items. Show or hide columns to
        match your workflow.
      </p>
      <div className="mt-6">
        <FeedbackTable />
      </div>
    </div>
  );
}