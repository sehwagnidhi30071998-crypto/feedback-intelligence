import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import { Waveform } from "@/components/Wordmark";
import { noindex } from "@/lib/seo";

export const metadata: Metadata = {
  ...noindex,
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 py-14">
      <Link href="/login" className="mb-8 flex items-center gap-2 text-ink">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-signal-soft">
          <Waveform active className="h-4 w-4" />
        </span>
        <span className="font-display text-base font-semibold tracking-tight">
          Feedback Intelligence
        </span>
      </Link>

      <p className="fi-eyebrow">Shared workspace</p>
      <h1 className="fi-page-title mt-1">Sign in</h1>
      <p className="fi-page-sub">
        Pick up where the last review left off.
      </p>

      <div className="fi-card mt-6 overflow-hidden">
        <div className="h-1 bg-signal" aria-hidden />
        <div className="p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}