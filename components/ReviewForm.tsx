"use client";

import { useActionState, useState } from "react";
import { createReview } from "@/lib/actions";
import StarRating from "@/components/StarRating";

export default function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [state, formAction, pending] = useActionState(createReview, {});

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div className="fi-notice border-danger-soft bg-danger-soft text-danger">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="fi-notice border-ok-soft bg-ok-soft text-ok">
          {state.success}
        </div>
      ) : null}

      <div>
        <p className="fi-label">Rating</p>
        <div className="mt-2">
          <StarRating value={rating} onChange={setRating} />
        </div>
        <input type="hidden" name="rating" value={rating || ""} />
        <p className="mt-1 text-xs text-faint">Tap a star to rate 1–5.</p>
      </div>

      <div>
        <label className="fi-label" htmlFor="review-comment">
          Your review
        </label>
        <textarea
          id="review-comment"
          name="comment"
          required
          rows={4}
          placeholder="What did you like? What could be better?"
          className="fi-input resize-none"
        />
      </div>

      <div>
        <label className="fi-label" htmlFor="review-name">
          Your name <span className="font-normal text-faint">(optional)</span>
        </label>
        <input
          id="review-name"
          name="author_name"
          type="text"
          maxLength={80}
          placeholder="Jane Doe"
          className="fi-input"
        />
      </div>

      <button type="submit" disabled={pending} className="fi-btn-primary w-full">
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}