export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-surface-line bg-white px-6 py-5 md:flex-row md:items-center">
      <div>
        {eyebrow ? <p className="text-xs font-medium uppercase text-ink-muted">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold text-ink-strong">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
