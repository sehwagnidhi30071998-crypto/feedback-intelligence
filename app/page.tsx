import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import Wordmark, { Waveform } from "@/components/Wordmark";
import { createClient } from "@/lib/supabase-server";
import StarRating from "@/components/StarRating";

export const metadata: Metadata = {
  title: "Turn meeting talk into tracked work",
  description:
    "Extract actionable product feedback from meeting transcripts and turn approved items into Jira tickets.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "Turn meeting talk into tracked work",
    description:
      "Extract actionable product feedback from meeting transcripts and turn approved items into Jira tickets.",
  },
};

const stages = [
  {
    num: "01",
    title: "Add transcript",
    body: "Paste text, import a file, or upload a recording — the AI transcribes it for you.",
    accent: "bg-signal-soft text-signal",
  },
  {
    num: "02",
    title: "Review extracted feedback",
    body: "Every item is shown in full. Approve, reject, or flag it as a duplicate.",
    accent: "bg-amber-soft text-amber",
  },
  {
    num: "03",
    title: "Ship to Jira",
    body: "Approved items become tickets in your own workspace, tracked from here.",
    accent: "bg-ok-soft text-ok",
  },
] as const;

const capabilities = [
  {
    label: "Your Jira, your rules",
    body: "Connect your own Jira workspace. Tokens are stored encrypted and only ever used by your server.",
  },
  {
    label: "No signal left behind",
    body: "Every extracted item is shown in full — nothing hidden behind a summary.",
  },
  {
    label: "Save once, analyze anytime",
    body: "Store a transcript and run the analysis whenever you're ready — no re-entering.",
  },
] as const;

export default async function Home() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, author_name, created_at")
    .order("created_at", { ascending: false })
    .limit(3);
  const list = (reviews ?? []) as {
    id: string;
    rating: number;
    comment: string;
    author_name: string | null;
    created_at: string;
  }[];
  const avg =
    list.length > 0 ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
  const reviewCount = list.length;

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Feedback Intelligence",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: "/",
            description:
              "Extract actionable product feedback from meeting transcripts and turn approved items into Jira tickets.",
            featureList: [
              "AI transcript analysis",
              "Extract and review product feedback",
              "Create Jira tickets from approved items",
            ],
            ...(reviewCount > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: avg.toFixed(1),
                    reviewCount,
                  },
                }
              : {}),
          }),
        }}
      />
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Wordmark />
          <div className="flex items-center gap-2">
            <a href="#auth" className="fi-btn-ghost">
              Sign in
            </a>
            <a href="#auth" className="fi-btn-primary">
              Create account
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-14 lg:pb-24 lg:pt-20">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-16">
            <div>
              <p className="fi-eyebrow">Transcript → ticket</p>
              <h1 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">
                Turn meeting talk into tracked work.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
                Feedback Intelligence reads your meeting transcripts, extracts
                every piece of product feedback, and turns the approved ones
                into Jira tickets — so nothing said in the room gets lost.
              </p>

              <ol className="mt-10" aria-label="How it works">
                {stages.map((stage) => (
                  <li key={stage.num}>
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stage.accent}`}
                      >
                        <Waveform active className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                          {stage.num}
                        </p>
                        <p className="mt-0.5 font-display text-lg font-semibold tracking-tight text-ink">
                          {stage.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          {stage.body}
                        </p>
                      </div>
                    </div>
                    {stage.num !== "03" ? (
                      <span
                        className="my-3 ml-[22px] block h-5 w-px bg-line-strong"
                        aria-hidden
                      />
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>

            <div id="auth" className="scroll-mt-24 lg:sticky lg:top-24">
              <AuthCard />
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-6 py-14 lg:py-20">
            <p className="fi-eyebrow">What you get</p>
            <h2 className="mt-1 max-w-xl font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Built around the signal, not the paperwork.
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
              {capabilities.map((cap) => (
                <div
                  key={cap.label}
                  className="rounded-xl border border-line bg-paper p-5"
                >
                  <p className="font-display text-base font-semibold tracking-tight text-ink">
                    {cap.label}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {cap.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-paper">
          <div className="mx-auto w-full max-w-6xl px-6 py-14 lg:py-20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="fi-eyebrow">Community</p>
                <h2 className="mt-1 max-w-xl font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  Teams are turning talk into work.
                </h2>
                {reviewCount > 0 ? (
                  <div className="mt-3 flex items-center gap-3">
                    <StarRating value={Math.round(avg)} readOnly size="sm" />
                    <span className="font-display text-base font-semibold text-ink">
                      {avg.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted">
                      from {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">No reviews yet — be the first.</p>
                )}
              </div>
              <Link href="/reviews" className="fi-btn-primary shrink-0">
                Leave a review or request a feature
              </Link>
            </div>

            {list.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
                {list.map((r) => (
                  <div key={r.id} className="fi-card p-5">
                    <StarRating value={r.rating} readOnly size="sm" />
                    <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-ink">
                      {r.comment}
                    </p>
                    <p className="mt-3 font-mono text-xs text-faint">
                      {r.author_name ? r.author_name : "Anonymous"} · {r.rating}/5
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
                <p className="text-sm text-muted">
                  Reviews you receive will appear here and on the{" "}
                  <Link href="/reviews" className="fi-link">
                    community page
                  </Link>
                  .
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <Link href="/reviews" className="fi-link text-sm">
                View all reviews & feature requests →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <Wordmark />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-faint">
            Transcript → ticket
          </p>
        </div>
      </footer>
    </div>
  );
}