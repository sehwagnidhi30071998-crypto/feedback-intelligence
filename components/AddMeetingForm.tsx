"use client";

import { useActionState } from "react";
import { submitMeeting } from "@/lib/actions";
import FormButtons from "@/components/FormButtons";

export default function AddMeetingForm() {
  const [state, formAction] = useActionState(submitMeeting, {});

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div className="fi-notice border-danger-soft bg-danger-soft text-danger">
          {state.error}
        </div>
      ) : null}

      <div>
        <label className="fi-label" htmlFor="title">
          Meeting title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. Customer call — Acme Corp"
          className="fi-input"
        />
      </div>

      <div>
        <label className="fi-label" htmlFor="date">
          Meeting date
        </label>
        <input id="date" name="date" type="date" className="fi-input" />
      </div>

      <div>
        <label className="fi-label" htmlFor="participants">
          Participants
        </label>
        <input
          id="participants"
          name="participants"
          type="text"
          placeholder="e.g. Sarah, Mike, David"
          className="fi-input"
        />
        <p className="mt-1 text-xs text-faint">Separate names with commas.</p>
      </div>

      <div>
        <label className="fi-label" htmlFor="context">
          Additional context
        </label>
        <textarea
          id="context"
          name="context"
          rows={3}
          placeholder="Anything helpful for understanding the meeting, such as the product area discussed..."
          className="fi-input"
        />
      </div>

      <div>
        <label className="fi-label" htmlFor="transcript">
          Transcript
        </label>
        <textarea
          id="transcript"
          name="transcript"
          rows={10}
          required
          placeholder="Paste the meeting transcript here..."
          className="fi-input font-mono text-xs leading-relaxed"
        />
      </div>

      <FormButtons />

      <p className="text-xs text-faint">
        Save Meeting stores the meeting without analyzing it. Analyze Transcript
        saves it and extracts feedback items using AI.
      </p>
    </form>
  );
}