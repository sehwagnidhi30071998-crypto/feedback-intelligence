"use client";

import { useActionState } from "react";
import { createFeatureRequest } from "@/lib/actions";

export default function FeatureRequestForm() {
  const [state, formAction, pending] = useActionState(createFeatureRequest, {});

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
        <label className="fi-label" htmlFor="fr-description">
          Feature description
        </label>
        <textarea
          id="fr-description"
          name="feature_description"
          required
          rows={3}
          placeholder="What should the product do?"
          className="fi-input resize-none"
        />
      </div>

      <div>
        <label className="fi-label" htmlFor="fr-problem">
          What problem would it solve?
        </label>
        <textarea
          id="fr-problem"
          name="problem"
          required
          rows={3}
          placeholder="For example, 'I spend an hour each week copying feedback into Jira manually.'"
          className="fi-input resize-none"
        />
      </div>

      <div>
        <label className="fi-label" htmlFor="fr-name">
          Your name <span className="font-normal text-faint">(optional)</span>
        </label>
        <input
          id="fr-name"
          name="author_name"
          type="text"
          maxLength={80}
          placeholder="Jane Doe"
          className="fi-input"
        />
      </div>

      <button type="submit" disabled={pending} className="fi-btn-primary w-full">
        {pending ? "Sending…" : "Send feature request"}
      </button>
    </form>
  );
}