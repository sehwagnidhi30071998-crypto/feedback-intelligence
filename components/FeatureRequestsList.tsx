export type FeatureRequestRow = {
  id: string;
  feature_description: string;
  problem: string;
  author_name: string | null;
  status: string;
  created_at: string;
};

const statusStyles: Record<string, string> = {
  open: "bg-paper text-muted border-line",
  considered: "bg-amber-soft text-amber border-amber-soft",
  planned: "bg-signal-soft text-signal border-signal-soft",
  done: "bg-ok-soft text-ok border-ok-soft",
  rejected: "bg-danger-soft text-danger border-danger-soft",
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function FeatureRequestsList({
  requests,
}: {
  requests: FeatureRequestRow[];
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-paper p-8 text-center">
        <p className="font-display text-base font-semibold text-ink">No feature requests yet</p>
        <p className="mt-1 text-sm text-muted">Share an idea — what would make this more useful?</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li key={r.id} className="fi-card p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-sm font-semibold text-ink">
              {r.feature_description}
            </p>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] ${statusStyles[r.status] ?? statusStyles.open}`}
            >
              {r.status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{r.problem}</p>
          <p className="mt-3 font-mono text-xs text-faint">
            {r.author_name ? r.author_name : "Anonymous"} · {timeAgo(r.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}