import {
  AlertTriangle,
  Bell,
  Bot,
  Brain,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  GitBranch,
  Hash,
  Layers3,
  ListChecks,
  Megaphone,
  MessageSquare,
  Network,
  PenTool,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Table2,
  Target,
  TestTube2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "ai-company-ops.v10";
const APP_VERSION = "2026.05.06-production-workflow";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const agents = [
  { id: "ceo", name: "총괄관리AI", role: "총괄", title: "우선순위/승인", icon: Megaphone, color: "bg-orange-500", channel: "#총괄-운영", specialty: "범위, 우선순위, 승인 기준 관리" },
  { id: "strategy", name: "전략기획AI", role: "전략", title: "MVP/지표", icon: Target, color: "bg-sky-500", channel: "#전략-기획", specialty: "사용자 문제, MVP 범위, 성공 지표" },
  { id: "pm", name: "요구사항AI", role: "PM", title: "PRD/요구사항", icon: FileText, color: "bg-blue-500", channel: "#요구사항-prd", specialty: "요구사항, 수용 기준, 변경 영향" },
  { id: "ux", name: "UX설계AI", role: "UX", title: "화면/UML", icon: PenTool, color: "bg-pink-500", channel: "#ux-uml", specialty: "사용자 흐름, 화면 IA, UML" },
  { id: "arch", name: "기술설계AI", role: "아키텍트", title: "API/DB/보안", icon: Layers3, color: "bg-emerald-500", channel: "#기술-설계", specialty: "아키텍처, API, DB, 권한" },
  { id: "dev", name: "개발관리AI", role: "개발", title: "WBS/GitHub", icon: Code2, color: "bg-violet-500", channel: "#개발-wbs", specialty: "작업 분해, 이슈, PR 연결" },
  { id: "qa", name: "품질검증AI", role: "QA", title: "TC/릴리즈", icon: TestTube2, color: "bg-amber-500", channel: "#qa-검증", specialty: "테스트 케이스, 결함, 릴리즈 게이트" },
  { id: "ops", name: "운영관리AI", role: "운영", title: "배포/모니터링", icon: Rocket, color: "bg-cyan-500", channel: "#운영-배포", specialty: "배포, 알림, API 연결 상태" },
];

const boards = [
  { id: "chat", label: "업무 대화", icon: MessageSquare },
  { id: "prd", label: "요구서", icon: FileText },
  { id: "wbs", label: "WBS", icon: Table2 },
  { id: "uml", label: "UML", icon: Network },
  { id: "api", label: "API/DB", icon: Database },
  { id: "qa", label: "QA", icon: TestTube2 },
  { id: "risk", label: "리스크", icon: AlertTriangle },
  { id: "release", label: "릴리즈", icon: ShieldCheck },
  { id: "integrations", label: "연결 상태", icon: GitBranch },
  { id: "final", label: "최종본", icon: CheckCircle2 },
];

const defaultProjects = [
  {
    id: "project-academic-os",
    name: "동의대학교 학사 협업 OS",
    mission: "학생, 교수, 조교가 공지, 과제, 출결, 상담, 알림을 한 곳에서 관리하는 학사 SaaS를 만든다.",
  },
];

function getTime() {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(new Date());
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function getAgent(id) {
  return agents.find((agent) => agent.id === id) || agents[0];
}

function isUsableText(value) {
  return typeof value === "string" && value.trim().length > 0 && !/[�]/.test(value) && !/\?{2,}/.test(value);
}

function makeFallbackArtifacts(state) {
  const project = state.projectName || "프로젝트";
  return {
    prd: [
      { title: "문제 정의", body: `${project}의 사용자는 여러 채널에 흩어진 일정, 과제, 공지, 의사결정을 한 곳에서 추적해야 합니다.` },
      { title: "핵심 사용자", body: "학생, 교수, 조교, 관리자를 역할별로 나누고 각 역할의 읽기/쓰기 권한을 분리합니다." },
      { title: "수용 기준", body: "사용자는 로그인 후 오늘 처리해야 할 업무와 미확인 알림을 즉시 확인할 수 있어야 합니다." },
    ],
    wbs: [
      { title: "TASK-001 인증/권한", body: "사용자 역할, 워크스페이스, RLS 정책을 설계합니다." },
      { title: "TASK-002 산출물 저장", body: "agent_runs, deliverables, notifications 저장 흐름을 구현합니다." },
      { title: "TASK-003 알림/검색", body: "실시간 알림 목록과 산출물 검색 기능을 연결합니다." },
    ],
    uml: [
      { title: "Use Case", body: "사용자는 프로젝트 선택, 명령 입력, 산출물 확인, 알림 확인, 최종본 검토를 수행합니다." },
      { title: "ERD", body: "agent_runs 1:N deliverables, agent_runs 1:N notifications 구조입니다." },
    ],
    api: [
      { title: "POST /api/ai/company-run", body: "명령을 받아 AI 직원 실행, 산출물 생성, Supabase 저장을 처리합니다." },
      { title: "GET /api/ai/company-runs/latest", body: "Supabase에 저장된 최신 실행 결과를 불러옵니다." },
      { title: "GET /api/ai/status", body: "OpenAI, Supabase, GitHub, Kakao 연결 상태를 확인합니다." },
    ],
    qa: [
      { title: "저장 검증", body: "명령 실행 후 agent_runs, deliverables, notifications에 데이터가 생성되는지 확인합니다." },
      { title: "입력 검증", body: "Enter는 전송, Shift+Enter는 줄바꿈으로 동작해야 합니다." },
    ],
    risk: [
      { title: "비밀키 노출", body: "OpenAI/Supabase secret key는 브라우저와 GitHub에 올라가면 안 됩니다." },
      { title: "자동화 신뢰성", body: "AI 산출물은 최종 승인 전까지 검토 필요 상태로 관리합니다." },
    ],
    release: [
      { title: "로컬 운영", body: "API 서버와 웹 서버를 함께 실행해야 전체 기능이 동작합니다." },
      { title: "배포 전 확인", body: "환경변수, Supabase RLS, API 호출 제한, 로그 정책을 확인합니다." },
    ],
    integrations: [
      { title: "OpenAI", body: "AI 직원 응답과 산출물 생성을 담당합니다." },
      { title: "Supabase", body: "실행 기록, 산출물, 알림을 저장합니다." },
      { title: "GitHub", body: "이슈, PR, TASK ID 연결을 위해 다음 단계에서 붙입니다." },
    ],
    final: [
      { title: "최종 요약", body: `${project}는 명령, AI 실행, 산출물, 알림, 최종본을 DB에 남기는 프로젝트 운영 시스템입니다.` },
      { title: "다음 작업", body: "GitHub App 연결, 프로젝트별 실행 기록 필터, 사용자 인증 기반 권한 분리를 진행합니다." },
    ],
  };
}

const initialState = {
  version: APP_VERSION,
  projects: defaultProjects,
  activeProjectId: defaultProjects[0].id,
  projectName: defaultProjects[0].name,
  mission: defaultProjects[0].mission,
  activeAgentId: "ceo",
  activeBoard: "chat",
  bootstrapped: false,
  hydrated: false,
  processing: false,
  messages: [],
  notifications: [{ id: "n-ready", title: "작업 준비 완료", body: "프로젝트를 선택하고 명령을 입력하면 실행 기록과 산출물이 저장됩니다.", time: getTime(), tone: "info" }],
  automationLog: [],
  generatedArtifacts: null,
  apiStatus: null,
};

function selectAgentsForCommand(command) {
  const text = command.toLowerCase();
  if (text.includes("api") || text.includes("연동") || text.includes("github") || text.includes("깃허브")) return ["ceo", "arch", "dev", "ops", "qa"];
  if (text.includes("uml") || text.includes("설계") || text.includes("erd")) return ["ceo", "ux", "arch", "pm"];
  if (text.includes("테스트") || text.includes("qa") || text.includes("릴리즈")) return ["ceo", "qa", "dev", "ops"];
  return ["ceo", "strategy", "pm", "ux", "arch", "dev", "qa", "ops"];
}

function buildLocalRun(command, state, reason = "로컬 실행") {
  const selectedIds = selectAgentsForCommand(command);
  const timestamp = Date.now();
  const messages = selectedIds.map((agentId, index) => ({
    id: `${agentId}-${timestamp}-${index}`,
    agentId,
    body: `${getAgent(agentId).name}가 '${command}'에 대한 담당 산출물을 정리했습니다.`,
    tasks: ["요구사항 검토", "산출물 갱신", "검토 항목 기록"],
    time: getTime(),
  }));
  return {
    selectedIds,
    messages,
    notifications: [{ id: `n-${timestamp}`, title: "로컬 산출물 생성", body: "API 응답 대신 로컬 규칙으로 산출물을 갱신했습니다.", tone: "warning", time: getTime() }],
    log: { id: `log-${timestamp}`, title: reason, body: `${selectedIds.map((id) => getAgent(id).name).join(" → ")} 순서로 처리했습니다.`, time: getTime() },
    artifacts: makeFallbackArtifacts(state),
  };
}

async function requestJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.error || "API 요청에 실패했습니다.");
  return payload.data;
}

async function requestLatestCompanyRun() {
  return requestJson("/api/ai/company-runs/latest");
}

async function requestIntegrationStatus() {
  return requestJson("/api/ai/status");
}

async function requestCompanyRun(command, state) {
  return requestJson("/api/ai/company-run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, projectName: state.projectName, mission: state.mission }),
  });
}

function materializeRun(apiRun, command, state, reason) {
  const timestamp = Date.now();
  const selectedIds = apiRun.selectedAgents?.length ? apiRun.selectedAgents : selectAgentsForCommand(command);
  const messages = (apiRun.messages || []).map((message, index) => ({
    id: `${message.agentId || selectedIds[index] || "ceo"}-${timestamp}-${index}`,
    agentId: message.agentId || selectedIds[index] || "ceo",
    body: message.body || "산출물을 정리했습니다.",
    tasks: Array.isArray(message.tasks) && message.tasks.length ? message.tasks : ["산출물 정리"],
    time: getTime(),
  }));
  const notifications = (apiRun.notifications || []).map((item, index) => ({
    id: `n-api-${timestamp}-${index}`,
    title: item.title || "산출물 생성",
    body: item.body || "산출물을 업데이트했습니다.",
    tone: item.tone || "info",
    time: getTime(),
  }));
  if (apiRun.persisted) {
    notifications.unshift({
      id: `n-db-${timestamp}`,
      title: apiRun.persisted.saved ? "Supabase 저장 완료" : "Supabase 저장 확인 필요",
      body: apiRun.persisted.saved ? "실행 기록, 산출물, 알림이 DB에 저장되었습니다." : apiRun.persisted.error || "Supabase 저장을 확인해야 합니다.",
      tone: apiRun.persisted.saved ? "success" : "warning",
      time: getTime(),
    });
  }
  return {
    selectedIds,
    messages,
    notifications,
    log: { id: `log-api-${timestamp}`, title: apiRun.automationLog?.title || reason, body: apiRun.automationLog?.body || "AI 실행이 완료되었습니다.", time: getTime() },
    artifacts: apiRun.artifacts || state.generatedArtifacts || makeFallbackArtifacts(state),
  };
}

function AgentAvatar({ agent, size = "md" }) {
  const Icon = agent.icon;
  return <div className={classNames("flex shrink-0 items-center justify-center rounded-md text-white", agent.color, size === "lg" ? "h-11 w-11" : "h-8 w-8")}><Icon size={size === "lg" ? 22 : 17} /></div>;
}

function Message({ message }) {
  const agent = getAgent(message.agentId);
  return (
    <article className="flex gap-3 px-5 py-4 hover:bg-zinc-900/70">
      <AgentAvatar agent={agent} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="font-semibold text-white">{agent.name}</h3>
          <span className="text-xs text-zinc-500">{agent.role} · {agent.title}</span>
          <span className="text-xs text-zinc-500">{message.time}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-200">{message.body}</p>
        <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-zinc-400"><CheckCircle2 size={14} />실행 항목</p>
          <ul className="space-y-1.5">
            {message.tasks.map((task) => <li key={task} className="flex gap-2 text-sm text-zinc-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-300" />{task}</li>)}
          </ul>
        </div>
      </div>
    </article>
  );
}

function statusLabel(item) {
  if (!item) return { text: "확인 중", className: "bg-zinc-800 text-zinc-300" };
  if (item.connected) return { text: "연결됨", className: "bg-emerald-400/10 text-emerald-300" };
  if (item.configured) return { text: "설정됨", className: "bg-yellow-400/10 text-yellow-300" };
  return { text: "미연결", className: "bg-zinc-800 text-zinc-400" };
}

function IntegrationChecklist({ apiStatus }) {
  const rows = [
    { key: "openai", name: "OpenAI API", detail: "AI 직원 응답과 산출물 생성을 담당합니다." },
    { key: "supabase", name: "Supabase", detail: "agent_runs, deliverables, notifications 저장소입니다." },
    { key: "github", name: "GitHub App", detail: "Issue, PR, TASK ID 연결용입니다." },
    { key: "kakao", name: "Kakao", detail: "혼자 쓰는 단계에서는 선택 사항입니다." },
  ];
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-white"><GitBranch size={16} className="text-yellow-300" />API 연결 상태</p>
      <div className="mt-3 space-y-3">
        {rows.map((row) => {
          const status = statusLabel(apiStatus?.[row.key]);
          return <div key={row.key} className="rounded-md border border-zinc-800 bg-black p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-zinc-100">{row.name}</p><span className={classNames("rounded-full px-2 py-1 text-xs", status.className)}>{status.text}</span></div><p className="mt-2 text-xs leading-5 text-zinc-500">{apiStatus?.[row.key]?.error || row.detail}</p></div>;
        })}
      </div>
    </section>
  );
}

function ArtifactBoard({ boardId, state, searchQuery }) {
  const artifacts = { ...makeFallbackArtifacts(state), ...(state.generatedArtifacts || {}) };
  const query = searchQuery.trim().toLowerCase();
  const rows = (artifacts[boardId] || []).filter((row) => !query || `${row.title} ${row.body}`.toLowerCase().includes(query));
  const board = boards.find((item) => item.id === boardId);
  const Icon = board?.icon || FileText;
  return (
    <div className="app-scrollbar h-full min-h-0 overflow-y-auto overscroll-contain bg-zinc-950 p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-zinc-800 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-yellow-300"><Icon size={20} /></div><div><h2 className="text-lg font-semibold text-white">{board?.label} 산출물</h2><p className="text-sm text-zinc-500">{state.projectName} 기준 산출물입니다.</p></div></div>
        {boardId === "final" && <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">검토용 최종본</span>}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((row) => <article key={`${row.title}-${row.body}`} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"><h3 className="text-sm font-semibold text-white">{row.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-300">{row.body}</p></article>)}
      </div>
      {rows.length === 0 && <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">검색 결과가 없습니다.</p>}
    </div>
  );
}

function RightPanel({ state }) {
  const activeAgent = getAgent(state.activeAgentId);
  return (
    <aside className="hidden h-full min-h-0 w-80 shrink-0 flex-col border-l border-zinc-800 bg-zinc-950 xl:flex">
      <div className="shrink-0 border-b border-zinc-800 p-4"><p className="text-xs font-semibold uppercase text-zinc-500">현재 담당</p><div className="mt-3 flex items-center gap-3"><AgentAvatar agent={activeAgent} size="lg" /><div><p className="font-semibold text-white">{activeAgent.name}</p><p className="text-sm text-zinc-400">{activeAgent.specialty}</p></div></div></div>
      <div className="app-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-white"><Bell size={16} className="text-yellow-300" />실시간 알림</p><div className="mt-3 space-y-3">{state.notifications.map((item) => <div key={item.id} className="rounded-md border border-zinc-800 bg-black p-3"><p className="text-sm font-semibold text-zinc-100">{item.title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{item.body}</p><p className="mt-2 text-xs text-zinc-600">{item.time}</p></div>)}</div></section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-white"><ListChecks size={16} className="text-emerald-400" />자동화 로그</p><div className="mt-3 space-y-3">{state.automationLog.map((item) => <div key={item.id} className="rounded-md border border-zinc-800 bg-black p-3"><p className="text-sm font-semibold text-zinc-100">{item.title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{item.body}</p><p className="mt-2 text-xs text-zinc-600">{item.time}</p></div>)}</div></section>
        <IntegrationChecklist apiStatus={state.apiStatus} />
      </div>
    </aside>
  );
}

export default function AICompanyApp() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(saved);
      return parsed?.version === APP_VERSION ? { ...initialState, ...parsed } : initialState;
    } catch {
      return initialState;
    }
  });
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const autoTimer = useRef(null);
  const activeAgent = getAgent(state.activeAgentId);
  const currentMessages = useMemo(() => state.messages.filter((message) => (message.agentId === state.activeAgentId || message.agentId === "ceo") && (!searchQuery.trim() || `${message.body} ${message.tasks.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase()))), [state.activeAgentId, state.messages, searchQuery]);

  function persist(nextState) {
    const normalized = { ...nextState, version: APP_VERSION };
    setState(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  function syncActiveProject(projects, activeProjectId) {
    const project = projects.find((item) => item.id === activeProjectId) || projects[0];
    return { projectName: project.name, mission: project.mission };
  }

  function updateActiveProject(field, value) {
    const projects = state.projects.map((project) => project.id === state.activeProjectId ? { ...project, [field]: value } : project);
    persist({ ...state, projects, [field === "name" ? "projectName" : "mission"]: value });
    if (field === "mission") {
      window.clearTimeout(autoTimer.current);
      autoTimer.current = window.setTimeout(() => applyRun(value, "프로젝트 목표 변경"), 900);
    }
  }

  function selectProject(projectId) {
    persist({ ...state, activeProjectId: projectId, ...syncActiveProject(state.projects, projectId), activeBoard: "final" });
  }

  function addProject() {
    const id = `project-${Date.now()}`;
    const project = { id, name: `새 프로젝트 ${state.projects.length + 1}`, mission: "프로젝트 목표를 입력하세요." };
    persist({ ...state, projects: [...state.projects, project], activeProjectId: id, projectName: project.name, mission: project.mission, messages: [], generatedArtifacts: null, activeBoard: "chat" });
  }

  async function applyRun(command, reason = "명령 실행") {
    const ceoCommand = { id: `ceo-command-${Date.now()}`, agentId: "ceo", body: command, tasks: ["명령 접수", "AI API 실행", "산출물 저장"], time: getTime() };
    const loadingState = { ...state, mission: command, processing: true, notifications: [{ id: `n-loading-${Date.now()}`, title: "AI 실행 중", body: "산출물을 생성하고 저장하고 있습니다.", tone: "info", time: getTime() }, ...state.notifications].slice(0, 8) };
    persist(loadingState);
    try {
      const apiRun = await requestCompanyRun(command, loadingState);
      const run = materializeRun(apiRun, command, loadingState, reason);
      persist({ ...loadingState, activeBoard: "final", activeAgentId: run.selectedIds.at(-1) || loadingState.activeAgentId, bootstrapped: true, processing: false, messages: [...run.messages, ceoCommand, ...loadingState.messages].slice(0, 80), notifications: [...run.notifications, ...loadingState.notifications].slice(0, 12), automationLog: [run.log, ...loadingState.automationLog].slice(0, 12), generatedArtifacts: run.artifacts });
    } catch (error) {
      const run = buildLocalRun(command, loadingState, `${reason} · 로컬 처리`);
      persist({ ...loadingState, activeBoard: "final", activeAgentId: run.selectedIds.at(-1) || loadingState.activeAgentId, bootstrapped: true, processing: false, messages: [...run.messages, ceoCommand, ...loadingState.messages].slice(0, 80), notifications: [{ id: `n-fallback-${Date.now()}`, title: "API 실행 확인 필요", body: `${error.message} 로컬 산출물로 임시 처리했습니다.`, tone: "warning", time: getTime() }, ...run.notifications, ...loadingState.notifications].slice(0, 12), automationLog: [run.log, ...loadingState.automationLog].slice(0, 12), generatedArtifacts: run.artifacts });
    }
  }

  function sendMessage(event) {
    event.preventDefault();
    const command = draft.trim();
    if (!command) return;
    applyRun(command);
    setDraft("");
  }

  function handleDraftKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function runAgent(agentId = state.activeAgentId) {
    const agent = getAgent(agentId);
    persist({ ...state, activeAgentId: agentId, activeBoard: "chat", notifications: [{ id: `n-agent-${Date.now()}`, title: `${agent.name} 확인`, body: `${agent.specialty} 기준으로 현재 산출물을 검토합니다.`, time: getTime(), tone: "info" }, ...state.notifications].slice(0, 12) });
  }

  function clearConversation() {
    if (!window.confirm("대화창만 삭제할까요? 요구서, 산출물, 알림, Supabase 기록은 유지됩니다.")) return;
    persist({ ...state, messages: [], notifications: [{ id: `n-clear-${Date.now()}`, title: "대화창 정리", body: "대화 메시지만 삭제했습니다. 산출물과 저장 기록은 유지됩니다.", time: getTime(), tone: "info" }, ...state.notifications].slice(0, 12) });
  }

  useEffect(() => {
    requestIntegrationStatus()
      .then((apiStatus) => {
        setState((current) => {
          const nextState = { ...current, apiStatus, version: APP_VERSION };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
          return nextState;
        });
      })
      .catch(() => {});
  }, [state.hydrated]);

  useEffect(() => {
    let cancelled = false;
    if (state.hydrated) return undefined;
    requestLatestCompanyRun().then((latest) => {
      if (cancelled) return;
      if (latest?.found && latest.data) {
        const run = materializeRun(latest.data, latest.run?.command || state.mission, state, "Supabase 최신 실행 복구");
        persist({ ...state, projectName: isUsableText(latest.run?.project_name) ? latest.run.project_name : state.projectName, mission: isUsableText(latest.run?.mission || latest.run?.command) ? (latest.run.mission || latest.run.command) : state.mission, activeBoard: "final", activeAgentId: run.selectedIds.at(-1) || state.activeAgentId, bootstrapped: true, hydrated: true, processing: false, messages: run.messages.slice(0, 80), notifications: run.notifications.slice(0, 12), automationLog: [run.log].slice(0, 12), generatedArtifacts: run.artifacts });
      } else {
        persist({ ...state, hydrated: true });
      }
    }).catch(() => !cancelled && persist({ ...state, hydrated: true }));
    return () => { cancelled = true; };
  }, [state.hydrated]);

  useEffect(() => {
    if (state.hydrated && !state.bootstrapped) {
      const timer = window.setTimeout(() => applyRun(state.mission, "초기 실행"), 300);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.hydrated, state.bootstrapped]);

  return (
    <div className="flex h-screen overflow-hidden bg-black text-zinc-100">
      <aside className="hidden w-72 shrink-0 border-r border-zinc-800 bg-zinc-950 md:flex md:flex-col">
        <div className="border-b border-zinc-800 p-4">
          <p className="text-xs font-semibold uppercase text-yellow-300">Project Operations</p>
          <select value={state.activeProjectId} onChange={(event) => selectProject(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-zinc-700 bg-black px-3 text-sm text-white outline-none">
            {state.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <button type="button" onClick={addProject} className="mt-2 h-9 w-full rounded-md border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900">프로젝트 추가</button>
          <div className="mt-3 flex h-9 items-center gap-2 rounded-md bg-zinc-900 px-3 text-sm text-zinc-300"><Search size={15} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="산출물 검색" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-500" /></div>
        </div>
        <div className="app-scrollbar flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase text-zinc-500">직무 채널</p>
          <div className="space-y-1">{agents.map((agent) => <button key={agent.id} type="button" onClick={() => persist({ ...state, activeAgentId: agent.id, activeBoard: "chat" })} className={classNames("flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm", state.activeAgentId === agent.id ? "bg-zinc-700 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white")}><Hash size={15} /><span className="truncate">{agent.channel.replace("#", "")}</span></button>)}</div>
          <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase text-zinc-500">AI 직원</p>
          <div className="space-y-2">{agents.map((agent) => <button key={agent.id} type="button" onClick={() => persist({ ...state, activeAgentId: agent.id, activeBoard: "chat" })} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-zinc-900"><AgentAvatar agent={agent} /><div className="min-w-0"><p className="truncate text-sm text-zinc-200">{agent.name}</p><p className="truncate text-xs text-zinc-500">{agent.title}</p></div></button>)}</div>
        </div>
        <div className="border-t border-zinc-800 p-3"><button type="button" onClick={clearConversation} className="h-9 w-full rounded-md border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900">대화창 정리</button></div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-800 bg-black px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold text-yellow-300">실행 기록 · 산출물 · 알림 · 최종본 관리</p><h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">프로젝트 운영 본부</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">AI 실행 결과를 Supabase에 저장하고, 프로젝트별 산출물을 검토합니다.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => applyRun(state.mission, "전체 산출물 갱신")} className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-300 px-4 text-sm font-bold text-black hover:bg-yellow-200"><Brain size={16} />전체 산출물 갱신</button><button type="button" onClick={() => runAgent()} className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 px-4 text-sm font-semibold text-white hover:bg-zinc-900"><Bot size={16} />선택 AI 확인</button></div></div>
        </header>

        <section className="grid border-b border-zinc-800 bg-zinc-950 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="p-4"><label className="text-xs font-semibold uppercase text-zinc-500">프로젝트 목표</label><textarea value={state.mission} onChange={(event) => updateActiveProject("mission", event.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-zinc-700 bg-black px-3 py-3 text-sm leading-6 text-zinc-100 outline-none focus:border-yellow-300" /></div><div className="border-t border-zinc-800 p-4 lg:border-l lg:border-t-0"><label className="text-xs font-semibold uppercase text-zinc-500">프로젝트 이름</label><input value={state.projectName} onChange={(event) => updateActiveProject("name", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-zinc-700 bg-black px-3 text-sm text-zinc-100 outline-none focus:border-yellow-300" /><div className="mt-3 flex items-center gap-2 text-sm text-zinc-400"><Users size={16} />프로젝트 {state.projects.length}개 · 알림 {state.notifications.length}개</div></div></section>

        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-4 py-2">{boards.map((board) => { const Icon = board.icon; return <button key={board.id} type="button" onClick={() => persist({ ...state, activeBoard: board.id })} className={classNames("inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium", state.activeBoard === board.id ? "bg-yellow-300 text-black" : "text-zinc-300 hover:bg-zinc-800 hover:text-white")}><Icon size={15} />{board.label}</button>; })}</nav>

        <section className="flex min-h-0 flex-1"><div className="flex min-h-0 min-w-0 flex-1 flex-col">{state.activeBoard === "chat" ? <><div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3"><div className="flex items-center gap-3"><Hash size={19} className="text-zinc-500" /><div><p className="font-semibold text-white">{activeAgent.channel}</p><p className="text-xs text-zinc-500">{activeAgent.name} · {activeAgent.specialty}</p></div></div><div className="hidden items-center gap-2 text-sm text-zinc-500 sm:flex"><MessageSquare size={16} />응답 {currentMessages.length}개</div></div><div className="app-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-zinc-950 py-2">{currentMessages.map((message) => <Message key={message.id} message={message} />)}</div><form onSubmit={sendMessage} className="border-t border-zinc-800 bg-black p-4"><div className="flex items-end gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3 focus-within:border-yellow-300"><Brain size={20} className="mt-2 shrink-0 text-yellow-300" /><textarea value={draft} onKeyDown={handleDraftKeyDown} onChange={(event) => setDraft(event.target.value)} placeholder="명령 입력 후 Enter, 줄바꿈은 Shift+Enter" className="min-h-11 flex-1 resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-zinc-500" /><button type="submit" disabled={state.processing} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-300 text-black hover:bg-yellow-200 disabled:opacity-50" aria-label="보내기"><Send size={17} /></button></div></form></> : <ArtifactBoard boardId={state.activeBoard} state={state} searchQuery={searchQuery} />}</div><RightPanel state={state} /></section>
      </main>
    </div>
  );
}
