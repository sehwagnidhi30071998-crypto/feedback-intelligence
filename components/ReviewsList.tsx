import StarRating from "@/components/StarRating";

export type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  author_name: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 60) return "1 month ago";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function ReviewsList({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-paper p-8 text-center">
        <p className="font-display text-base font-semibold text-ink">No reviews yet</p>
        <p className="mt-1 text-sm text-muted">Be the first to share what you think.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="fi-card p-5">
          <div className="flex items-start justify-between gap-4">
            <StarRating value={r.rating} readOnly size="sm" />
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-faint">
              {timeAgo(r.created_at)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink">{r.comment}</p>
          <p className="mt-2 font-mono text-xs text-faint">
            {r.author_name ? r.author_name : "Anonymous"}
            {" · "}
            {r.rating}/5
          </p>
        </li>
      ))}
    </ul>
  );
}