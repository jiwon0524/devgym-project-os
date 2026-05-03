export function FormField({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink-strong">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClassName =
  "h-10 w-full rounded-lg border border-surface-line bg-white px-3 text-sm text-ink-strong outline-none transition duration-150 placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand/15";

export const textareaClassName =
  "min-h-28 w-full resize-none rounded-lg border border-surface-line bg-white px-3 py-2.5 text-sm leading-6 text-ink-strong outline-none transition duration-150 placeholder:text-ink-faint focus:border-brand focus:ring-2 focus:ring-brand/15";
