"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = {
  target?: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: "Welcome to Feedback Intelligence",
    body: "A quick tour of how feedback flows through the workspace — from a saved transcript to a Jira ticket. You can skip this anytime.",
  },
  {
    target: "tour-sidebar",
    title: "Your workspace",
    body: "Everything lives in this sidebar. You'll move between the stages of the pipeline: add a transcript, review the extracted feedback, and create Jira tickets.",
  },
  {
    target: "tour-pipeline",
    title: "Three stages, one pipeline",
    body: "The dashboard shows the whole pipeline and how much is sitting at each stage. Click any stage card to jump into it.",
  },
  {
    target: "tour-stage-listen",
    title: "Stage 1 — Add a transcript",
    body: "Paste a meeting transcript here. Save it first if you like, then analyze it later straight from the list — no need to re-enter anything.",
  },
  {
    target: "tour-stage-review",
    title: "Stage 2 — Review extracted feedback",
    body: "Every extracted item is shown in full so nothing is hidden. Change its status with the dropdown, or open Review to edit the details.",
  },
  {
    target: "tour-stage-ship",
    title: "Stage 3 — Create Jira tickets",
    body: "Approved feedback is ready for Jira. Open a review screen, pick a workspace, and create the ticket — it's tracked right here.",
  },
  {
    target: "tour-settings",
    title: "Configure your workspace",
    body: "Connect your own Jira workspaces and check your AI model here. Tokens stay encrypted and are only ever used by your server.",
  },
  {
    title: "You're ready",
    body: "Start by adding your first transcript. Come back anytime by opening 'Take the tour' in the sidebar.",
  },
];

const STORAGE_KEY = "fi-tour-done";

type Rect = { top: number; left: number; width: number; height: number };

export default function Tour() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [rectStep, setRectStep] = useState(-1);

  useEffect(() => {
    const force = searchParams.get("tour") === "1";
    let shouldShow = force;
    if (!shouldShow) {
      try {
        shouldShow = !window.localStorage.getItem(STORAGE_KEY);
      } catch {
        // ignore storage failures
      }
    }
    if (shouldShow) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const current = STEPS[step];
    if (current?.target) {
      const timer = window.setTimeout(() => {
        const el = document.getElementById(current.target!);
        if (!el) return;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        window.setTimeout(() => {
          const r = el.getBoundingClientRect();
          setRect({
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
          });
          setRectStep(step);
        }, 380);
      }, 60);
      return () => {
        window.clearTimeout(timer);
        document.body.style.overflow = previous;
      };
    }

    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible, step]);

  if (!visible) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const highlight = rectStep === step ? rect : null;

  const finish = (skip: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage failures
    }
    setVisible(false);
    if (skip && searchParams.get("tour") === "1") {
      router.replace("/dashboard");
    }
  };

  const next = () => {
    if (isLast) {
      finish(false);
    } else {
      setRect(null);
      setRectStep(-1);
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={current.title}>
      {highlight ? (
        <div
          className="absolute rounded-xl border-2 border-signal"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            boxShadow: "0 0 0 9999px rgba(28,38,34,0.55)",
            transition: "all 320ms ease",
          }}
          aria-hidden
        />
      ) : (
        <div className="absolute inset-0 bg-ink/55" aria-hidden />
      )}

      <div className="absolute left-1/2 top-1/2 w-[min(92vw,27rem)] -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="fi-eyebrow">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
                {current.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => finish(true)}
              className="rounded-lg p-1.5 text-faint transition-colors hover:bg-paper hover:text-ink"
              aria-label="Skip tour"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-muted">{current.body}</p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={`h-1.5 rounded-full transition-all ${
                    i === step
                      ? "w-5 bg-signal"
                      : i < step
                        ? "w-1.5 bg-line-strong"
                        : "w-1.5 bg-line"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {!isFirst ? (
                <button
                  type="button"
                  onClick={() => {
                    setRect(null);
                    setRectStep(-1);
                    setStep((s) => s - 1);
                  }}
                  className="fi-btn-secondary px-3"
                >
                  Back
                </button>
              ) : null}
              <button
                type="button"
                onClick={next}
                className="fi-btn-primary"
              >
                {isLast ? "Finish" : isFirst ? "Start the tour" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}