"use client";

type Props = {
  value: number;
  onChange?: (next: number) => void;
  size?: "sm" | "md";
  readOnly?: boolean;
};

export default function StarRating({
  value,
  onChange,
  size = "md",
  readOnly = false,
}: Props) {
  const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const star = (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
            className={`${starSize} ${filled ? "text-amber" : "text-line-strong"}`}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.48 20.537a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
            />
          </svg>
        );

        if (readOnly || !onChange) {
          return (
            <span key={n} aria-hidden>
              {star}
            </span>
          );
        }

        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`Rate ${n} out of 5`}
            className="rounded p-0.5 transition-colors hover:bg-amber-soft"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}