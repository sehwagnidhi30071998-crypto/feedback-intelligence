import type { Metadata } from "next";
import Link from "next/link";
import AddMeetingForm from "@/components/AddMeetingForm";
import { noindex } from "@/lib/seo";

export const metadata: Metadata = {
  ...noindex,
  title: "Add transcript",
};

export default function NewMeetingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <Link
        href="/meetings"
        className="fi-link inline-flex items-center gap-1 text-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
        Back to Meetings
      </Link>

      <p className="fi-eyebrow mt-6">Pipeline · stage 1</p>
      <h1 className="fi-page-title mt-1">Add transcript</h1>
      <p className="fi-page-sub">
        Paste a transcript, import one from a file, or upload a recording to
        transcribe automatically — then analyze it to extract feedback.
      </p>

      <div className="fi-card mt-6 p-6">
        <AddMeetingForm />
      </div>
    </div>
  );
}