"use client";

import { useActionState } from "react";
import { submitMeeting } from "@/lib/actions";
import FormButtons from "@/components/FormButtons";

const inputClasses =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const labelClasses = "block text-sm font-medium text-zinc-700";

export default function AddMeetingForm() {
  const [state, formAction] = useActionState(submitMeeting, {});

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div>
        <label className={labelClasses} htmlFor="title">
          Meeting title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Customer call — Acme Corp"
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses} htmlFor="date">
          Meeting date
        </label>
        <input id="date" name="date" type="date" className={inputClasses} />
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
        <p className="mt-1 text-xs text-zinc-400">Separate names with commas.</p>
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
          required
          placeholder="Paste the meeting transcript here..."
          className={`${inputClasses} font-mono text-xs`}
        />
      </div>

      <FormButtons />

      <p className="text-xs text-zinc-400">
        Save Meeting stores the meeting without analyzing it. Analyze Transcript
        saves it and extracts feedback items using AI.
      </p>
    </form>
  );
}