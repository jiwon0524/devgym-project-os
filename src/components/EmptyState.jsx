import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./Button.jsx";

export function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-surface-line bg-white px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-brand-line bg-brand-soft text-brand">
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-ink-strong">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
        {actionLabel ? (
          <Button className="mt-6" variant="primary" onClick={onAction}>
            {actionLabel}
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
