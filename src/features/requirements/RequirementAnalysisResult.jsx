import {
  CheckSquare,
  ChevronDown,
  Database,
  GitBranch,
  ListChecks,
  Monitor,
  Plus,
  Route,
  Sparkles,
} from "lucide-react";
import { Button } from "../../components/Button.jsx";
import { Card, CardBody, CardHeader } from "../../components/Card.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { useRequirementAssistant } from "./RequirementAssistantContext.jsx";

const sections = [
  { id: "functional", label: "기능", title: "기능 요구사항", icon: ListChecks },
  { id: "ui", label: "UI", title: "UI 요구사항", icon: Monitor },
  { id: "api", label: "API", title: "API 설계", icon: Route },
  { id: "database", label: "DB", title: "데이터베이스 스키마", icon: Database },
  { id: "tasks", label: "작업", title: "작업 분해", icon: CheckSquare },
];

function EmptyAnalysis() {
  return (
    <div className="rounded-lg border border-dashed border-surface-line bg-white p-8 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Sparkles size={18} aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-ink-strong">아직 분석 결과가 없습니다</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        자연어 요구사항을 입력하고 분석하기를 누르면 기능, UI, API, DB, 작업으로 자동 분해됩니다.
      </p>
    </div>
  );
}

function FilterTabs({ analysis }) {
  const { activeFilter, setActiveFilter } = useRequirementAssistant();
  const filters = [
    { id: "all", label: "전체", count: sections.reduce((sum, section) => sum + (analysis[section.id]?.length || 0), 0) },
    ...sections.map((section) => ({
      id: section.id,
      label: section.label,
      count: analysis[section.id]?.length || 0,
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => setActiveFilter(filter.id)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition duration-150 ${
            activeFilter === filter.id
              ? "border-brand bg-brand-soft text-brand"
              : "border-surface-line bg-white text-ink-muted hover:bg-surface-muted hover:text-ink-strong"
          }`}
        >
          {filter.label}
          <span className="ml-2 text-xs opacity-70">{filter.count}</span>
        </button>
      ))}
    </div>
  );
}

function CollapsibleSection({ section, count, children }) {
  const { openSections, toggleSection } = useRequirementAssistant();
  const Icon = section.icon;
  const open = openSections[section.id];

  return (
    <Card className="analysis-enter overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition duration-150 hover:bg-surface-muted"
        onClick={() => toggleSection(section.id)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-ink-base">
            <Icon size={17} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-semibold text-ink-strong">{section.title}</span>
            <span className="block text-sm text-ink-muted">{count}개 항목</span>
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`text-ink-muted transition duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? <CardBody className="border-t border-surface-line">{children}</CardBody> : null}
    </Card>
  );
}

function TextList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="rounded-lg border border-surface-line bg-surface-muted p-3 text-sm leading-6 text-ink-base">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ApiList({ items }) {
  return (
    <div className="space-y-2">
      {items.map((api) => (
        <div key={`${api.method}-${api.path}`} className="rounded-lg border border-surface-line bg-surface-muted p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-ink-strong px-2 py-1 font-mono text-xs font-semibold text-white">
              {api.method}
            </span>
            <span className="font-mono text-sm font-semibold text-ink-strong">{api.path}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{api.description}</p>
        </div>
      ))}
    </div>
  );
}

function ErdDiagram({ tables, relationships }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {tables.map((table) => (
          <div key={table.name} className="overflow-hidden rounded-lg border border-surface-line bg-white">
            <div className="border-b border-surface-line bg-surface-muted px-4 py-3">
              <p className="text-xs font-medium uppercase text-ink-muted">테이블</p>
              <h3 className="font-mono text-base font-semibold text-ink-strong">{table.name}</h3>
            </div>
            <div className="divide-y divide-surface-line">
              {table.columns.map((column) => (
                <div key={`${table.name}-${column.name}`} className="grid grid-cols-[minmax(0,1fr)_88px_44px] items-center gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-mono font-medium text-ink-strong">{column.name}</p>
                    {column.description ? <p className="mt-1 text-xs text-ink-muted">{column.description}</p> : null}
                  </div>
                  <span className="font-mono text-xs text-ink-muted">{column.type}</span>
                  {column.key ? (
                    <span
                      className={`rounded-md px-2 py-1 text-center text-xs font-semibold ${
                        column.key === "PK"
                          ? "bg-brand-soft text-brand"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {column.key}
                    </span>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {relationships.length ? (
        <div className="rounded-lg border border-surface-line bg-surface-muted p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
            <GitBranch size={16} aria-hidden="true" />
            추천 FK 관계
          </div>
          <div className="mt-3 space-y-2">
            {relationships.map((relationship) => (
              <div key={`${relationship.from}-${relationship.to}`} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono text-ink-strong">{relationship.from}</span>
                <span className="text-ink-muted">→</span>
                <span className="font-mono text-ink-strong">{relationship.to}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-ink-muted">{relationship.type}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TaskBreakdown({ tasks }) {
  const { addGeneratedTasks, lastAddedCount } = useRequirementAssistant();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.title} className="flex items-center justify-between gap-3 rounded-lg border border-surface-line bg-surface-muted p-3">
            <p className="text-sm font-medium text-ink-strong">{task.title}</p>
            <StatusBadge value={task.priority} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={addGeneratedTasks}>
          <Plus size={16} aria-hidden="true" />
          작업 보드에 추가
        </Button>
        {lastAddedCount !== null ? (
          <p className="text-sm text-ink-muted">
            {lastAddedCount > 0 ? `${lastAddedCount}개 작업을 추가했습니다.` : "이미 추가된 작업입니다."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function RequirementAnalysisResult() {
  const { analysis, activeFilter } = useRequirementAssistant();

  if (!analysis) return <EmptyAnalysis />;

  const visibleSections = sections.filter(
    (section) => activeFilter === "all" || activeFilter === section.id
  );

  return (
    <div className="space-y-4">
      <Card className="analysis-enter">
        <CardHeader eyebrow="AI 분석 결과" title="개발자가 바로 실행할 수 있는 요구사항으로 정리했습니다">
          {analysis.meta.summary}
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {analysis.meta.detectedRequirements.map((requirement) => (
              <span key={requirement} className="rounded-full border border-surface-line bg-surface-muted px-3 py-1 text-xs font-medium text-ink-base">
                {requirement}
              </span>
            ))}
          </div>
          <FilterTabs analysis={analysis} />
        </CardBody>
      </Card>

      {visibleSections.map((section) => {
        const items = analysis[section.id] || [];
        if (!items.length) return null;

        return (
          <CollapsibleSection key={section.id} section={section} count={items.length}>
            {section.id === "api" ? <ApiList items={items} /> : null}
            {section.id === "database" ? (
              <ErdDiagram tables={items} relationships={analysis.relationships || []} />
            ) : null}
            {section.id === "tasks" ? <TaskBreakdown tasks={items} /> : null}
            {section.id === "functional" || section.id === "ui" ? <TextList items={items} /> : null}
          </CollapsibleSection>
        );
      })}
    </div>
  );
}
