"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-24 text-center">
      <h1 className="fi-page-title text-2xl">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">
        An unexpected error occurred. Try again, or head back to the dashboard.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="fi-btn-primary"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="fi-btn-secondary"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}