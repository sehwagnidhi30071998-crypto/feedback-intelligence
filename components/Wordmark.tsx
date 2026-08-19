const BARS = [0.4, 0.75, 0.55, 1, 0.65, 0.85, 0.45];

export function Waveform({
  className = "",
  active = false,
}: {
  className?: string;
  active?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`fi-wave ${active ? "fi-wave-active" : ""} inline-flex items-end gap-[2.5px] ${className}`}
    >
      {BARS.map((height, i) => (
        <span
          key={i}
          className="fi-wave-bar inline-block w-[3px] rounded-sm bg-current"
          style={{ height: `${Math.round(height * 100)}%` }}
        />
      ))}
    </span>
  );
}

export default function Wordmark({
  active = false,
  className = "",
}: {
  active?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-signal-soft">
        <Waveform active={active} className="h-4 w-4" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
          Feedback Intelligence
        </span>
        <span className="mt-1 font-mono text-[9.5px] font-medium uppercase tracking-[0.22em] text-faint">
          transcript → ticket
        </span>
      </span>
    </span>
  );
}