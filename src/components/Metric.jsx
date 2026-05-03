export function Metric({ label, value, detail }) {
  return (
    <div className="rounded-lg border border-surface-line bg-white p-4">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink-strong">{value}</p>
      {detail ? <p className="mt-1 text-xs text-ink-muted">{detail}</p> : null}
    </div>
  );
}
