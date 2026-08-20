import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/supabase-server";
import ReviewsHub from "@/components/ReviewsHub";
import StarRating from "@/components/StarRating";

export const metadata: Metadata = {
  title: "Reviews & Feature Requests",
  description:
    "Leave a review or send a feature request for Feedback Intelligence.",
  alternates: { canonical: "/reviews" },
  openGraph: {
    type: "website",
    url: "/reviews",
    title: "Reviews & Feature Requests",
    description:
      "Leave a review or send a feature request for Feedback Intelligence.",
  },
};

export default async function ReviewsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const [reviewsRes, featureRes] = await Promise.all([
    supabase.from("reviews").select("id, rating, comment, author_name, created_at").order("created_at", { ascending: false }),
    supabase.from("feature_requests").select("id, feature_description, problem, author_name, status, created_at").order("created_at", { ascending: false }),
  ]);

  const reviews = (reviewsRes.data ?? []) as {
    id: string;
    rating: number;
    comment: string;
    author_name: string | null;
    created_at: string;
  }[];
  const featureRequests = (featureRes.data ?? []) as {
    id: string;
    feature_description: string;
    problem: string;
    author_name: string | null;
    status: string;
    created_at: string;
  }[];

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <p className="fi-eyebrow">Community</p>
      <h1 className="fi-page-title mt-1">Reviews & feature requests</h1>
      <p className="fi-page-sub">
        One place to share what you think and shape what comes next.
      </p>

      {reviews.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface px-5 py-4">
          <div className="flex items-center gap-3">
            <StarRating value={Math.round(avg)} readOnly />
            <span className="font-display text-lg font-semibold text-ink">
              {avg.toFixed(1)}
            </span>
            <span className="text-sm text-muted">
              from {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span className="text-sm text-muted">
            {featureRequests.length} feature {featureRequests.length === 1 ? "request" : "requests"}
          </span>
          <span className="ml-auto">
            <Link href="/" className="fi-link text-sm">
              Back to home
            </Link>
          </span>
        </div>
      ) : null}

      <div className="mt-8">
        <ReviewsHub
          reviews={reviews}
          featureRequests={featureRequests}
          isSignedIn={Boolean(user)}
        />
      </div>
    </div>
  );
}