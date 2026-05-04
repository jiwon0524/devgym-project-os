export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-surface-line">
      <div className="flex gap-1 overflow-x-auto px-6">
        {tabs.map((tab) => {
          const id = typeof tab === "string" ? tab : tab.id;
          const label = typeof tab === "string" ? tab : tab.label;

          return (
            <button
              key={id}
              type="button"
              data-testid={`tab-${id}`}
              onClick={() => onChange(id)}
              className={`border-b-2 px-3 py-3 text-sm font-medium transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                activeTab === id
                  ? "border-brand text-ink-strong"
                  : "border-transparent text-ink-muted hover:text-ink-strong"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
