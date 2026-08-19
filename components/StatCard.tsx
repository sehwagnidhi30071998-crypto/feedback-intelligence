const accents: Record<string, string> = {
  signal: "text-signal bg-signal-soft",
  amber: "text-amber bg-amber-soft",
  ok: "text-ok bg-ok-soft",
  muted: "text-muted bg-paper",
  danger: "text-danger bg-danger-soft",
};

const icons: Record<string, React.ReactNode> = {
  signal: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
    />
  ),
};

export default function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: keyof typeof accents;
}) {
  return (
    <div className="fi-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="fi-eyebrow">{label}</p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accents[accent]}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4"
          >
            {icons[accent] ?? icons.signal}
          </svg>
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
        {value}
      </p>
    </div>
  );
}