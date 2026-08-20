"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import FeatureRequestForm from "@/components/FeatureRequestForm";
import ReviewsList, { type ReviewRow } from "@/components/ReviewsList";
import FeatureRequestsList, {
  type FeatureRequestRow,
} from "@/components/FeatureRequestsList";

type Tab = "review" | "feature";

export default function ReviewsHub({
  reviews,
  featureRequests,
  isSignedIn,
}: {
  reviews: ReviewRow[];
  featureRequests: FeatureRequestRow[];
  isSignedIn: boolean;
}) {
  const [tab, setTab] = useState<Tab>("review");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-xl border border-line bg-surface">
        {(
          [
            { key: "review" as const, label: "Leave a review" },
            { key: "feature" as const, label: "Feature request" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`py-3 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-ink text-white"
                : "bg-surface text-muted hover:bg-paper hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="fi-card p-6">
          {!isSignedIn ? (
            <div className="fi-notice border-amber-soft bg-amber-soft text-amber">
              You need to be signed in to submit.{" "}
              <a href="/login" className="fi-link">
                Sign in
              </a>{" "}
              or{" "}
              <a href="/signup" className="fi-link">
                create an account
              </a>
              .
            </div>
          ) : null}
          <div className={isSignedIn ? "mt-0" : "mt-4"}>
            {tab === "review" ? <ReviewForm /> : <FeatureRequestForm />}
          </div>
        </div>

        <div>
          {tab === "review" ? (
            <ReviewsList reviews={reviews} />
          ) : (
            <FeatureRequestsList requests={featureRequests} />
          )}
        </div>
      </div>
    </div>
  );
}