"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveAiKey } from "@/lib/actions";
import {
  AI_PROVIDERS,
  PROVIDER_BASE_URLS,
  PROVIDER_DEFAULT_MODELS,
} from "@/lib/constants";

export type AiKeyFormInitial = {
  id: string;
  provider: string;
  model: string;
  baseUrl: string;
  keyTail: string;
};

export default function AiKeyForm({
  initial,
}: {
  initial?: AiKeyFormInitial;
}) {
  const [state, formAction, pending] = useActionState(saveAiKey, {});
  const [provider, setProvider] = useState(initial?.provider ?? "groq");

  return (
    <form action={formAction} className="space-y-4">
      {initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}
      {state.error ? (
        <div className="fi-notice border-danger-soft bg-danger-soft text-danger">
          {state.error}
        </div>
      ) : null}
      {state.saved ? (
        <div className="fi-notice border-ok-soft bg-ok-soft text-ok">
          Your AI key is saved. It will be used automatically when the app
          &apos;s shared quota runs out.
        </div>
      ) : null}

      <div>
        <label className="fi-label" htmlFor="provider">
          Provider
        </label>
        <select
          id="provider"
          name="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="fi-input"
        >
          {AI_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="claude" disabled>
            Claude — not supported yet
          </option>
        </select>
        <p className="mt-1 text-xs text-faint">
          The app uses its shared Groq key first, then falls back to this key
          when the shared quota runs out.
        </p>
      </div>

      <div>
        <label className="fi-label" htmlFor="model">
          Model
        </label>
        <input
          id="model"
          name="model"
          type="text"
          required
          placeholder={PROVIDER_DEFAULT_MODELS[provider]}
          defaultValue={initial?.model ?? ""}
          className="fi-input"
        />
        <p className="mt-1 text-xs text-faint">
          Default: {PROVIDER_DEFAULT_MODELS[provider]}. Leave blank to use it,
          or enter any model the provider supports.
        </p>
      </div>

      <div>
        <label className="fi-label" htmlFor="base_url">
          API base URL (optional)
        </label>
        <input
          id="base_url"
          name="base_url"
          type="url"
          placeholder={PROVIDER_BASE_URLS[provider]}
          defaultValue={initial?.baseUrl ?? ""}
          className="fi-input"
        />
        <p className="mt-1 text-xs text-faint">
          Leave blank to use {PROVIDER_BASE_URLS[provider]}.
        </p>
      </div>

      <div>
        <label className="fi-label" htmlFor="api_key">
          API key
        </label>
        <input
          id="api_key"
          name="api_key"
          type="password"
          required={!initial}
          placeholder={
            initial
              ? "Leave blank to keep the existing key"
              : "Paste your provider API key"
          }
          className="fi-input"
        />
        {initial ? (
          <p className="mt-1 text-xs text-faint">
            Stored key ends in …{initial.keyTail}. It is encrypted and never
            shown back.
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="fi-btn-primary"
      >
        {pending
          ? "Testing & saving…"
          : initial
            ? "Save changes"
            : "Test & save key"}
      </button>

      {initial ? (
        <Link href="/settings" className="fi-link ml-3 text-sm">
          Cancel
        </Link>
      ) : null}
    </form>
  );
}