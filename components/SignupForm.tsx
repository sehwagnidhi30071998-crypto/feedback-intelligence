"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/auth-actions";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, {});

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
          autoComplete="new-password"
          minLength={6}
          className="fi-input"
        />
        <p className="mt-1 text-xs text-faint">
          At least 6 characters. We use email confirmation to verify accounts.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="fi-btn-primary w-full"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="fi-link">
          Sign in
        </Link>
      </p>
    </form>
  );
}