import Link from "next/link";
import AddMeetingForm from "@/components/AddMeetingForm";

export default function NewMeetingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
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
        Back to Meetings
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
        Add Meeting
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enter the meeting details and paste the transcript for analysis.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <AddMeetingForm />
      </div>
    </div>
  );
}