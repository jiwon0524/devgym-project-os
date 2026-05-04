import {
  CheckCircle2,
  CheckSquare,
  Clipboard,
  Code2,
  Copy,
  Database,
  Download,
  FileText,
  FileCheck2,
  GitBranch,
  Layers3,
  ListChecks,
  Monitor,
  ShieldAlert,
  Sparkles,
  Table2,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/Button.jsx";
import { Card, CardBody, CardHeader } from "../../components/Card.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import {
  exportRequirementMarkdown,
  getApiSpecText,
  getTaskKey,
  normalizeAiRequirementResult,
} from "./aiRequirementUtils.js";
import { buildEngineeringArtifacts } from "./engineeringArtifacts.js";

const tabs = [
  { id: "summary", label: "요약", icon: Sparkles },
  { id: "requirements", label: "요구사항", icon: ListChecks },
  { id: "ui", label: "UI", icon: Monitor },
  { id: "api", label: "API", icon: Code2 },
  { id: "database", label: "DB/ERD", icon: Database },
  { id: "tasks", label: "작업", icon: CheckSquare },
  { id: "risks", label: "리스크", icon: ShieldAlert },
  { id: "acceptance", label: "인수 조건", icon: CheckCircle2 },
  { id: "tests", label: "테스트", icon: Clipboard },
  { id: "prd", label: "PRD", icon: FileText },
  { id: "uml", label: "UML", icon: Workflow },
  { id: "testPlan", label: "테스트 계획", icon: FileCheck2 },
  { id: "traceability", label: "추적 매트릭스", icon: Table2 },
];

function EmptyAnalysis() {
  return (
    <div className="rounded-lg border border-dashed border-surface-line bg-white p-8 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Sparkles size={18} aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-ink-strong">아직 AI 분석 결과가 없습니다</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        요구사항을 입력하면 기능/비기능 요구사항, API, DB, 리스크, 인수 조건, 테스트 케이스까지 생성됩니다.
      </p>
    </div>
  );
}

function SectionList({ items }) {
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

function JsonBlock({ value }) {
  return (
    <pre className="max-h-56 overflow-auto rounded-lg bg-ink-strong p-3 text-xs leading-5 text-white">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function DatabaseDiagram({ tables, relations }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {tables.map((table) => (
          <div key={table.tableName} className="overflow-hidden rounded-lg border border-surface-line bg-white">
            <div className="border-b border-surface-line bg-surface-muted px-4 py-3">
              <p className="text-xs font-medium uppercase text-ink-muted">테이블</p>
              <h3 className="font-mono text-base font-semibold text-ink-strong">{table.tableName}</h3>
            </div>
            <div className="divide-y divide-surface-line">
              {table.columns.map((column) => (
                <div key={`${table.tableName}-${column.name}`} className="grid grid-cols-[minmax(0,1fr)_88px_88px] items-center gap-3 px-4 py-3 text-sm">
                  <span className="truncate font-mono font-medium text-ink-strong">{column.name}</span>
                  <span className="font-mono text-xs text-ink-muted">{column.type}</span>
                  <span className="truncate text-xs text-ink-muted">{column.constraint || "-"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {relations.length ? (
        <div className="rounded-lg border border-surface-line bg-surface-muted p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
            <GitBranch size={16} aria-hidden="true" />
            ERD 관계 제안
          </div>
          <div className="mt-3 space-y-2">
            {relations.map((relation) => (
              <div key={`${relation.from}-${relation.to}`} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono text-ink-strong">{relation.from}</span>
                <span className="text-ink-muted">→</span>
                <span className="font-mono text-ink-strong">{relation.to}</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-ink-muted">{relation.type}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DocumentList({ title, items }) {
  return (
    <div className="rounded-lg border border-surface-line bg-white p-4">
      <h3 className="text-sm font-semibold text-ink-strong">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="text-sm leading-6 text-ink-base">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MermaidBlock({ title, description, code, onCopy }) {
  return (
    <Card>
      <CardHeader
        eyebrow="Mermaid UML"
        title={title}
        action={
          <Button variant="secondary" onClick={() => onCopy(code, `${title} 다이어그램을 복사했습니다.`)}>
            <Copy size={15} aria-hidden="true" />
            복사
          </Button>
        }
      >
        {description}
      </CardHeader>
      <CardBody>
        <pre className="max-h-72 overflow-auto rounded-lg bg-ink-strong p-4 text-xs leading-5 text-white">
          {code}
        </pre>
      </CardBody>
    </Card>
  );
}

function PrdView({ prd }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader eyebrow="Product Requirements Document" title={prd.title}>
          {prd.problem}
        </CardHeader>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <DocumentList title="목표" items={prd.goals} />
        <DocumentList title="범위" items={prd.scope.length ? prd.scope : ["분석 결과에서 범위가 아직 충분히 도출되지 않았습니다."]} />
        <DocumentList title="제외 범위" items={prd.outOfScope} />
        <DocumentList title="성공 지표" items={prd.successMetrics} />
      </div>
      <DocumentList title="대상 사용자" items={prd.targetUsers} />
    </div>
  );
}

function UmlView({ uml, onCopy }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <MermaidBlock
        title="Use Case"
        description="액터와 핵심 사용 사례를 연결합니다."
        code={uml.useCase}
        onCopy={onCopy}
      />
      <MermaidBlock
        title="Sequence"
        description="사용자, 프론트엔드, API, DB 호출 순서를 보여줍니다."
        code={uml.sequence}
        onCopy={onCopy}
      />
      <MermaidBlock
        title="Activity"
        description="요구사항에서 검증까지의 업무 흐름입니다."
        code={uml.activity}
        onCopy={onCopy}
      />
      <MermaidBlock
        title="State"
        description="요구사항과 작업의 상태 전이 기준입니다."
        code={uml.state}
        onCopy={onCopy}
      />
    </div>
  );
}

function TestPlanView({ testPlan }) {
  return (
    <div className="space-y-4">
      <DocumentList title="테스트 전략" items={testPlan.strategy} />
      <div className="grid gap-4 lg:grid-cols-2">
        {testPlan.levels.map((level) => (
          <div key={level.name} className="rounded-lg border border-surface-line bg-white p-4">
            <h3 className="text-sm font-semibold text-ink-strong">{level.name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{level.target}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <DocumentList title="진입 기준" items={testPlan.entryCriteria} />
        <DocumentList title="완료 기준" items={testPlan.exitCriteria} />
        <DocumentList title="회귀 범위" items={testPlan.regressionAreas} />
      </div>
    </div>
  );
}

function TraceabilityView({ rows }) {
  return (
    <div className="overflow-hidden rounded-lg border border-surface-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[960px] text-left text-sm">
          <thead className="border-b border-surface-line bg-surface-muted text-xs font-semibold uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">유형</th>
              <th className="px-4 py-3">요구사항</th>
              <th className="px-4 py-3">API</th>
              <th className="px-4 py-3">데이터</th>
              <th className="px-4 py-3">작업</th>
              <th className="px-4 py-3">테스트</th>
              <th className="px-4 py-3">리스크</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-line">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-ink-strong">{row.id}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{row.type}</td>
                <td className="px-4 py-3 leading-6 text-ink-base">{row.requirement}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-muted">{row.api}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-muted">{row.data}</td>
                <td className="px-4 py-3 leading-6 text-ink-muted">{row.task}</td>
                <td className="px-4 py-3 leading-6 text-ink-muted">{row.test}</td>
                <td className="px-4 py-3 leading-6 text-ink-muted">{row.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <div className="p-6 text-center text-sm text-ink-muted">추적할 요구사항이 없습니다.</div> : null}
    </div>
  );
}

export function RequirementResultTabs({
  analysis,
  selectedTaskKeys,
  onToggleTask,
  onAddSelectedTasks,
  onConvertToTaskBoard,
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const [feedback, setFeedback] = useState("");
  const normalized = useMemo(() => normalizeAiRequirementResult(analysis), [analysis]);
  const artifacts = useMemo(() => buildEngineeringArtifacts(normalized), [normalized]);

  if (!normalized) return <EmptyAnalysis />;

  const copyApiSpec = async () => {
    await navigator.clipboard.writeText(getApiSpecText(normalized));
    setFeedback("API 스펙을 클립보드에 복사했습니다.");
  };

  const copyText = async (text, message) => {
    await navigator.clipboard.writeText(text);
    setFeedback(message);
  };

  const copyArtifacts = async () => {
    if (!artifacts) return;
    await copyText(artifacts.markdown, "실무 산출물 문서를 클립보드에 복사했습니다.");
  };

  const exportMarkdown = () => {
    const markdown = exportRequirementMarkdown(normalized);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "requirement-analysis.md";
    link.click();
    URL.revokeObjectURL(url);
    setFeedback("Markdown 파일로 내보냈습니다.");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "requirements":
        return (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="기능 요구사항" eyebrow="Functional" />
              <CardBody>
                <SectionList items={normalized.functionalRequirements} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="비기능 요구사항" eyebrow="Non-functional" />
              <CardBody>
                <SectionList items={normalized.nonFunctionalRequirements} />
              </CardBody>
            </Card>
          </div>
        );
      case "ui":
        return <SectionList items={normalized.uiRequirements} />;
      case "api":
        return (
          <div className="space-y-3">
            {normalized.apiDesign.map((api) => (
              <Card key={`${api.method}-${api.path}`}>
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-ink-strong px-2 py-1 font-mono text-xs font-semibold text-white">
                      {api.method}
                    </span>
                    <span className="font-mono text-sm font-semibold text-ink-strong">{api.path}</span>
                  </div>
                  <p className="text-sm leading-6 text-ink-muted">{api.description}</p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <JsonBlock value={api.requestBody} />
                    <JsonBlock value={api.responseBody} />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        );
      case "database":
        return <DatabaseDiagram tables={normalized.databaseSchema} relations={normalized.erdRelations} />;
      case "tasks":
        return (
          <div className="space-y-2">
            {normalized.tasks.map((task) => {
              const taskKey = getTaskKey(task);
              return (
                <label key={taskKey} className="flex items-start gap-3 rounded-lg border border-surface-line bg-white p-3">
                  <input
                    className="mt-1 h-4 w-4 rounded border-surface-line text-brand focus:ring-brand"
                    type="checkbox"
                    checked={selectedTaskKeys.includes(taskKey)}
                    onChange={() => onToggleTask(task)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink-strong">{task.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-ink-muted">{task.description}</span>
                  </span>
                  <StatusBadge value={task.priority} />
                </label>
              );
            })}
          </div>
        );
      case "risks":
        return (
          <div className="space-y-2">
            {normalized.risks.map((risk) => (
              <div key={risk.content} className="flex items-start justify-between gap-3 rounded-lg border border-surface-line bg-white p-3">
                <p className="text-sm leading-6 text-ink-base">{risk.content}</p>
                <StatusBadge value={risk.severity} />
              </div>
            ))}
          </div>
        );
      case "acceptance":
        return <SectionList items={normalized.acceptanceCriteria} />;
      case "tests":
        return (
          <div className="space-y-3">
            {normalized.testCases.map((testCase) => (
              <Card key={testCase.title}>
                <CardBody>
                  <h3 className="font-semibold text-ink-strong">{testCase.title}</h3>
                  <dl className="mt-3 grid gap-2 text-sm">
                    <div><dt className="font-medium text-ink-muted">Given</dt><dd className="mt-1 text-ink-base">{testCase.given}</dd></div>
                    <div><dt className="font-medium text-ink-muted">When</dt><dd className="mt-1 text-ink-base">{testCase.when}</dd></div>
                    <div><dt className="font-medium text-ink-muted">Then</dt><dd className="mt-1 text-ink-base">{testCase.then}</dd></div>
                  </dl>
                </CardBody>
              </Card>
            ))}
          </div>
        );
      case "prd":
        return artifacts ? <PrdView prd={artifacts.prd} /> : null;
      case "uml":
        return artifacts ? <UmlView uml={artifacts.uml} onCopy={copyText} /> : null;
      case "testPlan":
        return artifacts ? <TestPlanView testPlan={artifacts.testPlan} /> : null;
      case "traceability":
        return artifacts ? <TraceabilityView rows={artifacts.traceability} /> : null;
      default:
        return (
          <Card>
            <CardHeader eyebrow={normalized.meta?.provider === "openai" ? "OpenAI 분석" : "분석 결과"} title="요약">
              {normalized.summary}
            </CardHeader>
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-ink-muted">요구사항</p>
                  <p className="mt-1 text-lg font-semibold text-ink-strong">
                    {normalized.functionalRequirements.length + normalized.nonFunctionalRequirements.length}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-ink-muted">작업</p>
                  <p className="mt-1 text-lg font-semibold text-ink-strong">{normalized.tasks.length}</p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-ink-muted">테스트 케이스</p>
                  <p className="mt-1 text-lg font-semibold text-ink-strong">{normalized.testCases.length}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onAddSelectedTasks} disabled={!selectedTaskKeys.length}>
          <CheckSquare size={16} aria-hidden="true" />
          선택 작업 추가
        </Button>
        <Button variant="secondary" onClick={copyApiSpec}>
          <Copy size={16} aria-hidden="true" />
          API 스펙 복사
        </Button>
        <Button variant="secondary" onClick={exportMarkdown}>
          <Download size={16} aria-hidden="true" />
          Markdown 내보내기
        </Button>
        <Button variant="secondary" onClick={copyArtifacts}>
          <FileText size={16} aria-hidden="true" />
          산출물 복사
        </Button>
        <Button variant="primary" onClick={onConvertToTaskBoard}>
          <Layers3 size={16} aria-hidden="true" />
          작업 보드로 변환
        </Button>
      </div>

      {feedback ? <p className="text-sm text-ink-muted">{feedback}</p> : null}

      <div className="nav-scrollbar flex gap-2 overflow-x-auto border-b border-surface-line">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex h-11 shrink-0 items-center gap-2 border-b-2 px-2 text-sm font-medium transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                activeTab === tab.id
                  ? "border-brand text-ink-strong"
                  : "border-transparent text-ink-muted hover:text-ink-strong"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {renderContent()}
    </div>
  );
}
