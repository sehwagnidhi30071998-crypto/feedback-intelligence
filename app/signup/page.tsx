import Link from "next/link";
import SignupForm from "@/components/SignupForm";
import { Waveform } from "@/components/Wordmark";

export default function SignupPage() {
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
      <h1 className="fi-page-title mt-1">Create account</h1>
      <p className="fi-page-sub">
        Start turning conversation into tracked work.
      </p>

      <div className="fi-card mt-6 overflow-hidden">
        <div className="h-1 bg-signal" aria-hidden />
        <div className="p-6">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}