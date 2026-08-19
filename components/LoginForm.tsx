"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, {});

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div className="fi-notice border-danger-soft bg-danger-soft text-danger">
          {state.error}
        </div>
      ) : null}

      <div>
        <label className="fi-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="fi-input"
        />
      </div>

      <div>
        <label className="fi-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="fi-input"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="fi-btn-primary w-full"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-sm text-muted">
        No account yet?{" "}
        <Link href="/signup" className="fi-link">
          Create one
        </Link>
      </p>
    </form>
  );
}