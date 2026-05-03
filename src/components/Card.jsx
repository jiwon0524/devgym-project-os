export function Card({ children, className = "" }) {
  return (
    <section className={`rounded-lg border border-surface-line bg-white shadow-soft ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({ eyebrow, title, action, children }) {
  return (
    <div className="border-b border-surface-line px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="mb-1 text-xs font-medium uppercase text-ink-muted">{eyebrow}</p>
          ) : null}
          <h2 className="text-base font-semibold text-ink-strong">{title}</h2>
          {children ? <p className="mt-1 text-sm text-ink-muted">{children}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
