import {
  Activity,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileText,
  GitBranch,
  Layers3,
  Lightbulb,
  MessageSquareText,
  PenTool,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TestTube2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

const STORAGE_KEY = "aicompany.projectos.v1";

const assistants = [
  {
    id: "ceo-chief",
    name: "Aiden",
    title: "Chief of Staff",
    department: "CEO Office",
    icon: BriefcaseBusiness,
    accent: "bg-slate-900",
    focus: "목표 정렬, 우선순위, 의사결정",
    promise: "프로젝트를 회사 운영 관점으로 쪼개고 오늘 해야 할 결정을 정리합니다.",
  },
  {
    id: "pm",
    name: "Mina",
    title: "Senior Product Manager",
    department: "Product",
    icon: Target,
    accent: "bg-blue-600",
    focus: "PRD, 요구사항, 성공지표",
    promise: "막연한 아이디어를 사용자 문제, 범위, 수용 기준으로 바꿉니다.",
  },
  {
    id: "designer",
    name: "Rowan",
    title: "UX Designer",
    department: "Design",
    icon: PenTool,
    accent: "bg-rose-600",
    focus: "화면 흐름, 정보구조, 사용성",
    promise: "사용자가 길을 잃지 않는 화면 구조와 핵심 UX 결정을 만듭니다.",
  },
  {
    id: "architect",
    name: "Noah",
    title: "SaaS Architect",
    department: "Architecture",
    icon: Layers3,
    accent: "bg-cyan-700",
    focus: "도메인 모델, API, 데이터 구조",
    promise: "기능을 확장 가능한 SaaS 구조로 설계하고 기술 리스크를 줄입니다.",
  },
  {
    id: "engineer",
    name: "Jules",
    title: "Full-stack Engineer",
    department: "Engineering",
    icon: Code2,
    accent: "bg-emerald-700",
    focus: "구현 계획, 이슈 분해, GitHub 연결",
    promise: "개발자가 바로 움직일 수 있게 태스크와 구현 순서를 만듭니다.",
  },
  {
    id: "qa",
    name: "Sora",
    title: "QA Lead",
    department: "Quality",
    icon: TestTube2,
    accent: "bg-amber-600",
    focus: "테스트 케이스, 결함 예방, 릴리즈 기준",
    promise: "요구사항이 실제로 검증 가능한지 확인하고 테스트 전략을 냅니다.",
  },
  {
    id: "devops",
    name: "Kai",
    title: "DevOps Manager",
    department: "Operations",
    icon: Rocket,
    accent: "bg-indigo-700",
    focus: "배포, 환경변수, 운영 체크리스트",
    promise: "실서비스에 필요한 배포, 모니터링, 보안 준비를 점검합니다.",
  },
];

const initialCompany = {
  companyName: "DevGym AI Company",
  projectName: "대학교 학사 도구",
  mission:
    "학생, 교수, 조교가 수강신청, 과제, 공지, 상담 일정을 한 곳에서 관리하는 학사 협업 SaaS를 만든다.",
  audience: "대학생, 교수, 조교, 학과 행정 담당자",
  constraints: "모바일 우선, 카카오 로그인, GitHub 이슈 연동, 학기별 권한 관리",
  stage: "Discovery",
  selectedAssistantId: "pm",
  briefHistory: [],
  assignments: [],
};

const stageOptions = ["Discovery", "Planning", "Design", "Build", "QA", "Launch"];

function createAssignments(company) {
  const now = new Date().toISOString();
  return assistants.map((assistant, index) => {
    const output = buildAssistantOutput(assistant.id, company);

    return {
      id: `${assistant.id}-${Date.now()}-${index}`,
      assistantId: assistant.id,
      status: index < 2 ? "In progress" : "Queued",
      priority: index === 0 ? "Critical" : index < 4 ? "High" : "Medium",
      updatedAt: now,
      task: output.task,
      output: output.body,
      checklist: output.checklist,
    };
  });
}

function buildAssistantOutput(assistantId, company) {
  const project = company.projectName || "새 소프트웨어 프로젝트";
  const mission = company.mission || "아직 미션이 입력되지 않았습니다.";
  const audience = company.audience || "핵심 사용자를 정의해야 합니다.";

  const outputs = {
    "ceo-chief": {
      task: "CEO 브리핑과 오늘의 의사결정 정리",
      body: `${project}의 핵심 미션은 "${mission}"입니다. 오늘은 범위 확정, 첫 릴리즈 대상, 협업 권한 정책을 결정해야 합니다.`,
      checklist: ["오늘의 목표 3개 정의", "보류할 기능 명시", "오너가 결정할 리스크 표시"],
    },
    pm: {
      task: "PRD 초안과 수용 기준 작성",
      body: `${audience}가 겪는 문제를 기준으로 핵심 플로우를 정의합니다. 첫 버전은 사용자가 해야 할 일을 찾고, 담당자를 알고, 변경사항을 추적하는 데 집중합니다.`,
      checklist: ["문제 정의", "사용자 유형", "MVP 범위", "수용 기준", "성공지표"],
    },
    designer: {
      task: "사용자 여정과 화면 정보구조 설계",
      body: "첫 화면은 CEO Mission Control, 부서별 AI 직원, 산출물 보드가 한 번에 보이게 설계합니다. 사용자는 설명을 읽는 대신 일을 맡기고 결과를 확인해야 합니다.",
      checklist: ["핵심 여정", "첫 화면 우선순위", "빈 상태", "협업 코멘트 위치"],
    },
    architect: {
      task: "SaaS 도메인 모델과 API 초안",
      body: "Workspace, Project, Assistant, Assignment, Deliverable, Decision, Comment를 중심 모델로 잡습니다. 실제 AI 호출은 나중에 서버 함수로 분리합니다.",
      checklist: ["도메인 엔티티", "권한 모델", "AI 작업 큐", "감사 로그", "API 경계"],
    },
    engineer: {
      task: "구현 이슈 분해와 GitHub 연결 계획",
      body: "프론트는 AI 회사형 대시보드를 먼저 만들고, 이후 Supabase 테이블과 GitHub Issue 생성 API를 연결합니다. TASK ID를 커밋 메시지와 연결하는 규칙도 둡니다.",
      checklist: ["UI 리팩터링", "Assignment CRUD", "GitHub Issue 생성", "상태 자동 업데이트"],
    },
    qa: {
      task: "테스트 전략과 릴리즈 게이트",
      body: "좋은 요구사항인지, AI 산출물이 실행 가능한지, 권한별로 잘 막히는지 검증해야 합니다. 릴리즈 전에는 로그인, 초대, 산출물 생성, 이슈 연동을 smoke test로 묶습니다.",
      checklist: ["수용 기준 검증", "권한 테스트", "AI 출력 품질", "릴리즈 체크리스트"],
    },
    devops: {
      task: "운영 준비와 보안 체크",
      body: "카카오 secret, GitHub token, AI provider key는 브라우저에 두지 않고 서버 함수에서 처리합니다. 배포 환경별 URL과 redirect 설정을 표준화합니다.",
      checklist: ["환경변수 분리", "Redirect URL", "RLS 정책", "로그/모니터링", "백업"],
    },
  };

  return outputs[assistantId];
}

function formatTime(value) {
  if (!value) return "방금 전";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function Metric({ label, value, detail, icon: Icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <Icon size={18} className="text-slate-400" aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function AssistantCard({ assistant, selected, assignment, onSelect, onRun }) {
  const Icon = assistant.icon;

  return (
    <article
      className={classNames(
        "rounded-lg border bg-white p-4 transition",
        selected ? "border-slate-950 shadow-sm" : "border-slate-200 hover:border-slate-300"
      )}
    >
      <button type="button" className="w-full text-left" onClick={() => onSelect(assistant.id)}>
        <div className="flex items-start gap-3">
          <div className={classNames("flex h-10 w-10 items-center justify-center rounded-lg text-white", assistant.accent)}>
            <Icon size={20} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="truncate text-sm font-semibold text-slate-950">{assistant.name}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {assignment?.status || "Ready"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{assistant.title}</p>
            <p className="mt-3 text-xs font-medium uppercase text-slate-400">{assistant.department}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{assistant.promise}</p>
      </button>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">{assistant.focus}</p>
        <button
          type="button"
          onClick={() => onRun(assistant.id)}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Play size={13} aria-hidden="true" />
          실행
        </button>
      </div>
    </article>
  );
}

function AssignmentRow({ assignment, assistant, onPromote }) {
  const Icon = assistant.icon;

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[220px_minmax(0,1fr)_160px]">
      <div className="flex items-center gap-3">
        <div className={classNames("flex h-9 w-9 items-center justify-center rounded-lg text-white", assistant.accent)}>
          <Icon size={18} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">{assistant.department}</p>
          <p className="text-xs text-slate-500">{assistant.name} · {assistant.title}</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{assignment.task}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{assignment.output}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {assignment.checklist.map((item) => (
            <span key={item} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-start justify-between gap-3 lg:items-end">
        <div className="text-left lg:text-right">
          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
            {assignment.priority}
          </span>
          <p className="mt-2 text-xs text-slate-500">{formatTime(assignment.updatedAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => onPromote(assignment.id)}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <CheckCircle2 size={14} aria-hidden="true" />
          완료 처리
        </button>
      </div>
    </div>
  );
}

function DeliverableCard({ title, body, icon: Icon, items }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon size={18} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{body}</p>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-slate-600">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function AICompanyApp() {
  const [company, setCompany] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialCompany, ...JSON.parse(saved) } : initialCompany;
    } catch {
      return initialCompany;
    }
  });

  const selectedAssistant = assistants.find((assistant) => assistant.id === company.selectedAssistantId) || assistants[0];
  const selectedAssignment = company.assignments.find((item) => item.assistantId === selectedAssistant.id);
  const completedCount = company.assignments.filter((item) => item.status === "Done").length;
  const inProgressCount = company.assignments.filter((item) => item.status === "In progress").length;
  const readiness = useMemo(() => {
    if (!company.assignments.length) return 12;
    return Math.min(100, Math.round((completedCount / company.assignments.length) * 70 + inProgressCount * 4 + 20));
  }, [company.assignments.length, completedCount, inProgressCount]);

  function persist(nextCompany) {
    setCompany(nextCompany);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCompany));
  }

  function updateField(field, value) {
    persist({ ...company, [field]: value });
  }

  function startSprint() {
    const assignments = createAssignments(company);
    persist({
      ...company,
      stage: "Planning",
      assignments,
      briefHistory: [
        {
          id: `brief-${Date.now()}`,
          title: `${company.projectName || "새 프로젝트"} AI 회사 스프린트 시작`,
          body: "CEO가 미션을 입력했고 각 AI 부서가 첫 업무를 배정받았습니다.",
          createdAt: new Date().toISOString(),
        },
        ...company.briefHistory,
      ].slice(0, 8),
    });
  }

  function runAssistant(assistantId) {
    const assistant = assistants.find((item) => item.id === assistantId);
    if (!assistant) return;
    const output = buildAssistantOutput(assistantId, company);
    const nextAssignment = {
      id: `${assistantId}-${Date.now()}`,
      assistantId,
      status: "In progress",
      priority: assistantId === "ceo-chief" ? "Critical" : "High",
      updatedAt: new Date().toISOString(),
      task: output.task,
      output: output.body,
      checklist: output.checklist,
    };
    const nextAssignments = [
      nextAssignment,
      ...company.assignments.filter((assignment) => assignment.assistantId !== assistantId),
    ];

    persist({
      ...company,
      selectedAssistantId: assistantId,
      assignments: nextAssignments,
      briefHistory: [
        {
          id: `brief-${Date.now()}`,
          title: `${assistant.name}에게 업무 배정`,
          body: output.task,
          createdAt: new Date().toISOString(),
        },
        ...company.briefHistory,
      ].slice(0, 8),
    });
  }

  function completeAssignment(assignmentId) {
    persist({
      ...company,
      assignments: company.assignments.map((assignment) =>
        assignment.id === assignmentId ? { ...assignment, status: "Done", updatedAt: new Date().toISOString() } : assignment
      ),
    });
  }

  function resetCompany() {
    localStorage.removeItem(STORAGE_KEY);
    setCompany(initialCompany);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Building2 size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">AI Company OS</p>
              <h1 className="text-xl font-semibold text-slate-950">{company.companyName}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stageOptions.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => updateField("stage", stage)}
                className={classNames(
                  "h-9 rounded-md px-3 text-sm font-medium",
                  company.stage === stage ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  <Sparkles size={15} aria-hidden="true" />
                  CEO Mission Control
                </p>
                <h2 className="mt-4 text-3xl font-semibold text-slate-950">AI 직원들에게 프로젝트를 맡기세요.</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                  사용자는 CEO이고, AI 비서들은 Product, Design, Engineering, QA, Operations 부서처럼 움직입니다.
                  아이디어를 입력하면 각 부서가 자기 업무와 산출물을 나누어 처리하는 회사형 프로젝트 관리 시스템입니다.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startSprint}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Play size={16} aria-hidden="true" />
                  회사 스프린트 시작
                </button>
                <button
                  type="button"
                  onClick={resetCompany}
                  className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  초기화
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">프로젝트명</span>
                <input
                  className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-950"
                  value={company.projectName}
                  onChange={(event) => updateField("projectName", event.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">핵심 사용자</span>
                <input
                  className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-950"
                  value={company.audience}
                  onChange={(event) => updateField("audience", event.target.value)}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">CEO 미션</span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-md border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-slate-950"
                  value={company.mission}
                  onChange={(event) => updateField("mission", event.target.value)}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">제약조건과 연결할 도구</span>
                <input
                  className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-950"
                  value={company.constraints}
                  onChange={(event) => updateField("constraints", event.target.value)}
                />
              </label>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-950">회사 상태</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{company.stage}</span>
            </div>
            <div className="mt-5 grid gap-3">
              <Metric label="AI 직원" value={assistants.length} detail="부서별 전문 비서" icon={Bot} />
              <Metric label="진행 업무" value={company.assignments.length} detail={`${completedCount}개 완료`} icon={Activity} />
              <Metric label="릴리즈 준비도" value={`${readiness}%`} detail="산출물과 검증 기준 기반" icon={ShieldCheck} />
            </div>
          </aside>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">AI 부서 직원들</h2>
              <p className="mt-1 text-sm text-slate-500">각 직원은 프로젝트 업무를 자기 전문 영역으로 받아 처리합니다.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {assistants.map((assistant) => (
              <AssistantCard
                key={assistant.id}
                assistant={assistant}
                selected={assistant.id === selectedAssistant.id}
                assignment={company.assignments.find((item) => item.assistantId === assistant.id)}
                onSelect={(assistantId) => updateField("selectedAssistantId", assistantId)}
                onRun={runAssistant}
              />
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-950">부서별 업무 큐</h2>
              <p className="mt-1 text-sm text-slate-500">스프린트를 시작하면 AI 직원들이 회사 부서처럼 업무를 나눠 받습니다.</p>
            </div>
            {company.assignments.length ? (
              <div className="space-y-3">
                {company.assignments.map((assignment) => {
                  const assistant = assistants.find((item) => item.id === assignment.assistantId);
                  return (
                    <AssignmentRow
                      key={assignment.id}
                      assignment={assignment}
                      assistant={assistant}
                      onPromote={completeAssignment}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <Bot size={32} className="mx-auto text-slate-400" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold text-slate-950">아직 배정된 업무가 없습니다.</h3>
                <p className="mt-2 text-sm text-slate-500">CEO 미션을 적고 회사 스프린트를 시작하면 각 부서가 움직입니다.</p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className={classNames("flex h-10 w-10 items-center justify-center rounded-lg text-white", selectedAssistant.accent)}>
                  {(() => {
                    const Icon = selectedAssistant.icon;
                    return <Icon size={20} aria-hidden="true" />;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{selectedAssistant.name}</p>
                  <p className="text-xs text-slate-500">{selectedAssistant.title}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{selectedAssistant.promise}</p>
              <div className="mt-5 rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-400">현재 산출물</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {selectedAssignment?.output || "아직 실행 전입니다. 이 직원을 실행하면 해당 부서의 첫 산출물이 생성됩니다."}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-950">CEO 브리핑 기록</h2>
              <div className="mt-4 space-y-3">
                {company.briefHistory.length ? (
                  company.briefHistory.map((item) => (
                    <div key={item.id} className="border-l-2 border-slate-200 pl-3">
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{item.body}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatTime(item.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-500">스프린트 기록이 여기에 쌓입니다.</p>
                )}
              </div>
            </section>
          </aside>
        </section>

        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-950">회사형 산출물 보드</h2>
            <p className="mt-1 text-sm text-slate-500">이 제품이 단순 채팅이 아니라 프로젝트 회사처럼 보이게 만드는 핵심 모듈입니다.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DeliverableCard
              icon={FileText}
              title="PRD Room"
              body="PM AI가 사용자 문제, 범위, 성공지표, 수용 기준을 관리합니다."
              items={["요구사항 품질 점수", "수용 기준 자동 체크", "변경 영향 분석"]}
            />
            <DeliverableCard
              icon={MessageSquareText}
              title="Meeting Room"
              body="AI 직원들이 회의록, 결정사항, 액션 아이템을 남깁니다."
              items={["부서별 의견", "결정 로그", "담당자와 마감일"]}
            />
            <DeliverableCard
              icon={GitBranch}
              title="Engineering Board"
              body="개발 업무를 GitHub 이슈, PR, 커밋 ID와 연결합니다."
              items={["Issue 생성", "PR 상태 동기화", "TASK ID 연결"]}
            />
            <DeliverableCard
              icon={ClipboardCheck}
              title="QA Gate"
              body="QA AI가 릴리즈 가능 여부를 검증 기준으로 판단합니다."
              items={["테스트 케이스", "회귀 체크", "릴리즈 승인"]}
            />
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">차별점</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              사용자가 문서를 직접 채우는 도구가 아니라, AI 직원들이 부서별로 묻고 만들고 검토하는 운영 시스템입니다.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">협업 방향</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              실제 사람 팀원은 CEO와 AI 직원들의 산출물에 댓글을 달고 승인합니다. AI는 직원, 사람은 의사결정자입니다.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <ArrowRight size={18} className="text-emerald-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">다음 구현</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              다음 단계는 실제 AI API를 붙여 직원별 산출물을 생성하고, Supabase에 Assignment와 Deliverable을 저장하는 것입니다.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
