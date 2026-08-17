import Link from "next/link";

const inputClasses =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const labelClasses = "block text-sm font-medium text-zinc-700";

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

      <form className="mt-6 space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <label className={labelClasses} htmlFor="title">
            Meeting title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="e.g. Customer call — Acme Corp"
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses} htmlFor="date">
            Meeting date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses} htmlFor="participants">
            Participants
          </label>
          <input
            id="participants"
            name="participants"
            type="text"
            placeholder="e.g. Sarah, Mike, David"
            className={inputClasses}
          />
          <p className="mt-1 text-xs text-zinc-400">
            Separate names with commas.
          </p>
        </div>

        <div>
          <label className={labelClasses} htmlFor="context">
            Additional context
          </label>
          <textarea
            id="context"
            name="context"
            rows={3}
            placeholder="Anything helpful for understanding the meeting, such as the product area discussed..."
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses} htmlFor="transcript">
            Transcript
          </label>
          <textarea
            id="transcript"
            name="transcript"
            rows={10}
            placeholder="Paste the meeting transcript here..."
            className={`${inputClasses} font-mono text-xs`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Save Meeting
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Analyze Transcript
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Save and Analyze are placeholders for now. They will be connected to
          the database and AI analysis in a later step.
        </p>
      </form>
    </div>
  );
}