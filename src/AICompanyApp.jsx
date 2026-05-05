import {
  AlertTriangle,
  Bell,
  Bot,
  Brain,
  CalendarDays,
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
  Play,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Table2,
  Target,
  TestTube2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

const STORAGE_KEY = "ai-company-ops.v4";
const APP_VERSION = "2026.05.06-practical-api";

const agents = [
  { id: "ceo", name: "대표총괄AI", role: "CEO", title: "의사결정/우선순위", icon: Megaphone, color: "bg-orange-500", channel: "#대표-브리핑", specialty: "목표, 범위, 승인 기준" },
  { id: "strategy", name: "전략기획AI", role: "전략", title: "시장/사용자/성과", icon: Target, color: "bg-sky-500", channel: "#전략-기획", specialty: "사용자 문제, 성공지표, MVP" },
  { id: "pm", name: "요구사항AI", role: "PM", title: "PRD/요구사항", icon: FileText, color: "bg-blue-500", channel: "#요구사항-prd", specialty: "요구사항, 수용 기준, 변경 영향" },
  { id: "ux", name: "UX설계AI", role: "UX", title: "화면/흐름/UML", icon: PenTool, color: "bg-pink-500", channel: "#ux-uml", specialty: "사용자 흐름, 유스케이스, 화면 IA" },
  { id: "arch", name: "기술설계AI", role: "아키텍트", title: "API/DB/구조", icon: Layers3, color: "bg-emerald-500", channel: "#기술-설계", specialty: "아키텍처, API, 데이터 모델" },
  { id: "dev", name: "개발관리AI", role: "개발", title: "WBS/GitHub/PR", icon: Code2, color: "bg-violet-500", channel: "#개발-wbs", specialty: "작업 분해, 이슈, 구현 순서" },
  { id: "qa", name: "품질검증AI", role: "QA", title: "TC/결함/릴리즈", icon: TestTube2, color: "bg-amber-500", channel: "#qa-검증", specialty: "테스트 케이스, 회귀, 승인" },
  { id: "ops", name: "배포운영AI", role: "운영", title: "배포/보안/모니터링", icon: Rocket, color: "bg-cyan-500", channel: "#배포-운영", specialty: "환경변수, 배포, 운영 로그" },
];

const boards = [
  { id: "chat", label: "업무 대화", icon: MessageSquare },
  { id: "prd", label: "PRD", icon: FileText },
  { id: "wbs", label: "WBS", icon: Table2 },
  { id: "uml", label: "UML", icon: Network },
  { id: "api", label: "API/DB", icon: Database },
  { id: "qa", label: "QA", icon: TestTube2 },
  { id: "risk", label: "리스크", icon: AlertTriangle },
  { id: "release", label: "릴리즈", icon: ShieldCheck },
  { id: "integrations", label: "연동", icon: GitBranch },
];

const artifacts = {
  prd: [
    { title: "문제 정의", body: "학생, 교수, 조교가 공지·과제·일정·상담 정보를 여러 도구에 흩어 관리해 누락과 중복 안내가 발생한다." },
    { title: "MVP 범위", body: "학기별 워크스페이스, 과목별 공지, 과제 제출 상태, 상담 예약, 역할별 권한을 첫 릴리즈 범위로 둔다." },
    { title: "수용 기준", body: "학생은 과목별 해야 할 일을 3초 안에 확인하고, 교수는 공지 발송 후 읽음/미확인 대상을 추적할 수 있어야 한다." },
    { title: "성공 지표", body: "공지 미확인율 30% 감소, 과제 누락 문의 40% 감소, 상담 예약 처리 시간 50% 단축." },
  ],
  wbs: [
    { title: "1. 인증/권한", body: "카카오 로그인, 학교 이메일 보조 인증, 학생·교수·조교·관리자 권한 모델." },
    { title: "2. 과목 워크스페이스", body: "학기, 과목, 분반, 참여자 초대, 역할 변경, 활동 로그." },
    { title: "3. 공지/과제", body: "공지 작성, 파일 첨부, 과제 생성, 제출 상태, 마감 알림." },
    { title: "4. 상담/일정", body: "교수 가능 시간, 학생 예약, 변경 알림, 캘린더 뷰." },
    { title: "5. QA/릴리즈", body: "권한별 테스트, 모바일 반응형, 알림 실패 재시도, 운영 로그 확인." },
  ],
  uml: [
    { title: "Use Case", body: "학생은 과제 확인/제출, 교수는 공지/과제 관리, 조교는 제출 현황 점검, 관리자는 학기/과목을 관리한다." },
    { title: "Class Diagram", body: "User, Workspace, Course, Notice, Assignment, Submission, Appointment, Notification, ActivityLog." },
    { title: "Sequence", body: "교수가 과제를 생성하면 수강생에게 알림이 큐잉되고 학생 제출 시 교수/조교 대시보드가 갱신된다." },
    { title: "ERD", body: "workspaces 1:N courses, courses 1:N assignments/notices, assignments 1:N submissions, users N:M course_members." },
  ],
  api: [
    { title: "POST /courses/:id/notices", body: "권한: 교수/조교. 공지를 생성하고 NotificationJob을 생성한다." },
    { title: "POST /assignments/:id/submissions", body: "권한: 학생. 제출 파일/메모를 저장하고 제출 상태를 Submitted로 변경한다." },
    { title: "GET /dashboard/todos", body: "로그인 사용자의 과목, 과제, 상담, 미확인 공지를 날짜순으로 반환한다." },
    { title: "DB 핵심", body: "users, workspaces, course_members, notices, assignments, submissions, appointments, notifications." },
  ],
  qa: [
    { title: "권한 테스트", body: "학생은 다른 학생 제출물을 볼 수 없고, 교수는 본인 과목만 관리 가능해야 한다." },
    { title: "마감 테스트", body: "마감 전/후 제출, 지각 제출 허용 여부, 시간대 처리, 모바일 업로드 실패를 검증한다." },
    { title: "알림 테스트", body: "공지/과제/상담 변경 알림이 중복 없이 발송되고 실패 시 재시도된다." },
    { title: "릴리즈 게이트", body: "P0 결함 0개, P1 결함 승인 처리, 핵심 플로우 smoke test 통과." },
  ],
  risk: [
    { title: "카카오 권한 심사", body: "이메일/메시지 권한은 심사 리스크가 있으므로 로그인과 초대 코드를 분리한다." },
    { title: "학교별 정책 차이", body: "학사 일정과 권한 구조가 학교마다 달라 설정 가능한 템플릿이 필요하다." },
    { title: "알림 피로도", body: "모든 이벤트를 알리면 사용자가 꺼버릴 수 있어 중요도별 알림 정책을 둔다." },
    { title: "개인정보", body: "상담 내용, 제출물, 학번은 접근 로그와 RLS 정책을 엄격히 적용해야 한다." },
  ],
  release: [
    { title: "Alpha", body: "단일 학교/단일 과목 기준으로 공지, 과제, 제출 현황, 역할 권한을 검증한다." },
    { title: "Beta", body: "여러 과목과 조교 협업, 상담 예약, 알림 재시도, 감사 로그를 붙인다." },
    { title: "Production", body: "관리자 콘솔, 백업, 모니터링, 개인정보 처리방침, 장애 대응 플로우를 준비한다." },
    { title: "운영 체크", body: "배포 전 환경변수, Supabase RLS, 카카오 Redirect URL, GitHub Webhook을 점검한다." },
  ],
  integrations: [
    { title: "1. AI API", body: "OpenAI 또는 Anthropic API를 서버 함수에 연결합니다. 브라우저에는 키를 두지 않고, 각 AI 직원의 role/context를 서버로 보내 산출물을 생성합니다." },
    { title: "2. Supabase", body: "Workspace, Project, AgentRun, Deliverable, Comment, ActivityLog를 저장합니다. RLS로 워크스페이스 멤버만 읽고 쓰게 합니다." },
    { title: "3. GitHub App/OAuth", body: "WBS 항목을 GitHub Issue로 만들고 PR 상태와 TASK ID 커밋을 다시 프로젝트 상태에 반영합니다." },
    { title: "4. Kakao", body: "카카오 로그인은 인증용으로, 카카오톡 메시지는 초대/알림용으로 분리합니다. 메시지 발송은 심사 후 서버 함수에서 처리합니다." },
  ],
};

const initialState = {
  projectName: "대학교 학사 협업 도구",
  mission: "학생, 교수, 조교가 공지, 과제, 일정, 상담을 한 곳에서 관리하고 놓치는 일을 줄이는 학사 SaaS를 만든다.",
  activeAgentId: "pm",
  activeBoard: "chat",
  version: APP_VERSION,
  messages: [
    { id: "m-1", agentId: "ceo", body: "대표님, 홍보 문구보다 실무 산출물이 먼저 보여야 합니다. 이 화면은 AI 직원 대화와 PRD, WBS, UML, API, QA, 리스크, 릴리즈를 함께 관리하는 운영 본부로 잡겠습니다.", tasks: ["실무 산출물 탭 구성", "각 AI 업무 책임 명확화", "프로젝트 운영 기준 정리"], time: "오전 9:10" },
    { id: "m-2", agentId: "pm", body: "PM 관점에서는 요구사항을 단순 메모로 두면 안 됩니다. 문제 정의, 사용자, 수용 기준, 성공 지표, 변경 영향까지 한 화면에서 점검해야 합니다.", tasks: ["PRD 초안 작성", "수용 기준 검증", "요구사항 변경 영향 관리"], time: "오전 9:14" },
  ],
  done: ["홍보형 문구 제거", "실무 산출물 구조 설계"],
};

function getTime() {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function getAgent(id) {
  return agents.find((agent) => agent.id === id) || agents[0];
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function buildAgentReply(agent, state) {
  const replies = {
    ceo: ["대표 관점에서 지금 중요한 건 기능 수가 아니라 의사결정 흐름입니다.", ["이번 주 목표 확정", "보류 기능 명시", "승인 기준 문서화"]],
    strategy: ["전략 관점에서는 학사 도구의 첫 고객을 좁혀야 합니다. 첫 타깃은 과제와 공지 누락이 많은 강의 운영자와 학생입니다.", ["1차 타깃 정의", "경쟁 도구 비교", "성공지표 확정"]],
    pm: ["요구사항은 기능명이 아니라 검증 가능한 문장이어야 합니다. 예: 교수는 과제 생성 후 미확인 학생 목록을 볼 수 있어야 합니다.", ["사용자 스토리 작성", "수용 기준 5개 생성", "변경 영향 표시"]],
    ux: ["UX는 채팅만으로 끝나면 안 됩니다. 사용자가 대화에서 나온 결과를 PRD, WBS, UML 탭에서 바로 확인해야 합니다.", ["Use Case 정리", "핵심 화면 흐름", "모바일 우선 IA"]],
    arch: ["기술 설계는 Workspace, Course, Assignment, Submission, Notification을 중심으로 잡겠습니다.", ["ERD 정리", "API 경계 정의", "RLS 정책 점검"]],
    dev: ["개발은 WBS를 GitHub Issue로 바로 전환할 수 있게 TASK ID와 담당 AI를 붙이는 구조가 필요합니다.", ["TASK ID 생성", "GitHub Issue 초안", "PR 상태 연결"]],
    qa: ["QA는 수용 기준을 테스트 케이스로 바꾸고, 권한/마감/알림 실패 케이스를 먼저 잡겠습니다.", ["권한 테스트", "마감 테스트", "릴리즈 게이트"]],
    ops: ["운영은 카카오, GitHub, AI API 키를 브라우저에 두지 않고 서버 함수와 환경변수로 관리해야 합니다.", ["환경변수 점검", "배포 체크리스트", "모니터링 계획"]],
  };
  const [body, tasks] = replies[agent.id];
  return { body: `${state.projectName}: ${body}`, tasks };
}

function AgentAvatar({ agent, size = "md" }) {
  const Icon = agent.icon;
  const sizeClass = size === "lg" ? "h-11 w-11" : "h-8 w-8";
  return <div className={classNames("flex shrink-0 items-center justify-center rounded-md text-white", agent.color, sizeClass)}><Icon size={size === "lg" ? 22 : 17} /></div>;
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
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-zinc-400"><CheckCircle2 size={14} /> 실행 항목</p>
          <ul className="space-y-1.5">
            {message.tasks.map((task) => <li key={task} className="flex gap-2 text-sm text-zinc-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-300" />{task}</li>)}
          </ul>
        </div>
      </div>
    </article>
  );
}

function ArtifactBoard({ boardId }) {
  const rows = artifacts[boardId] || [];
  const board = boards.find((item) => item.id === boardId);
  const Icon = board?.icon || FileText;
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-yellow-300"><Icon size={20} /></div>
        <div>
          <h2 className="text-lg font-semibold text-white">{board?.label} 산출물</h2>
          <p className="text-sm text-zinc-500">PM 대표 회사 기준으로 바로 검토 가능한 실무 문서입니다.</p>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((row) => (
          <article key={row.title} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="text-sm font-semibold text-white">{row.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{row.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function IntegrationChecklist() {
  const items = [
    { name: "AI API", status: "서버 함수 필요", detail: "OpenAI/Anthropic 키는 Edge Function 또는 백엔드에 저장" },
    { name: "Supabase", status: "DB/RLS 연결", detail: "프로젝트, 산출물, 댓글, 활동 로그 저장" },
    { name: "GitHub", status: "OAuth/App 필요", detail: "Issue 생성, PR 상태, TASK ID 커밋 연결" },
    { name: "Kakao", status: "인증/알림 분리", detail: "로그인은 Auth, 초대 메시지는 심사 후 서버 발송" },
  ];
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-white"><GitBranch size={16} className="text-yellow-300" />필수 API 연동</p>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={item.name} className="rounded-md border border-zinc-800 bg-black p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-100">{item.name}</p>
              <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-300">{item.status}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RightPanel({ state }) {
  const activeAgent = getAgent(state.activeAgentId);
  return (
    <aside className="hidden w-80 shrink-0 border-l border-zinc-800 bg-zinc-950 xl:block">
      <div className="border-b border-zinc-800 p-4">
        <p className="text-xs font-semibold uppercase text-zinc-500">현재 책임 AI</p>
        <div className="mt-3 flex items-center gap-3"><AgentAvatar agent={activeAgent} size="lg" /><div><p className="font-semibold text-white">{activeAgent.name}</p><p className="text-sm text-zinc-400">{activeAgent.specialty}</p></div></div>
      </div>
      <div className="space-y-4 p-4">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-white"><ListChecks size={16} className="text-emerald-400" />운영 체크</p><div className="mt-3 space-y-2">{state.done.map((item) => <div key={item} className="flex gap-2 text-sm text-zinc-300"><CheckCircle2 size={15} className="mt-0.5 text-emerald-400" />{item}</div>)}</div></section>
        <IntegrationChecklist />
        <section className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 p-4"><p className="text-sm font-semibold text-yellow-200">실무 기준</p><p className="mt-2 text-sm leading-6 text-yellow-50/90">대화는 과정이고, PRD/WBS/UML/API/QA/리스크/릴리즈와 API 연동 상태가 실제 결과물입니다.</p></section>
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
  const activeAgent = getAgent(state.activeAgentId);
  const currentMessages = useMemo(() => state.messages.filter((message) => message.agentId === state.activeAgentId || message.agentId === "ceo"), [state.activeAgentId, state.messages]);

  function persist(nextState) { setState(nextState); localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState)); }
  function updateField(field, value) { persist({ ...state, [field]: value }); }
  function runAgent(agentId = state.activeAgentId) {
    const agent = getAgent(agentId);
    const reply = buildAgentReply(agent, state);
    persist({ ...state, activeAgentId: agentId, activeBoard: "chat", messages: [{ id: `${agentId}-${Date.now()}`, agentId, body: reply.body, tasks: reply.tasks, time: getTime() }, ...state.messages], done: Array.from(new Set([`${agent.name} 산출물 검토`, ...state.done])).slice(0, 5) });
  }
  function runAllAgents() {
    const nextMessages = agents
      .filter((agent) => agent.id !== "ceo")
      .map((agent) => {
        const reply = buildAgentReply(agent, state);
        return { id: `${agent.id}-${Date.now()}`, agentId: agent.id, body: reply.body, tasks: reply.tasks, time: getTime() };
      });
    persist({
      ...state,
      activeBoard: "chat",
  version: APP_VERSION,
      messages: [...nextMessages, ...state.messages],
      done: ["전체 AI 산출물 검토", "PRD/WBS/UML/API/QA 연결", ...state.done].slice(0, 5),
    });
  }
  function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const reply = buildAgentReply(activeAgent, { ...state, mission: body });
    persist({ ...state, mission: body, activeBoard: "chat", messages: [{ id: `${activeAgent.id}-${Date.now()}`, agentId: activeAgent.id, body: reply.body, tasks: reply.tasks, time: getTime() }, { id: `ceo-${Date.now()}`, agentId: "ceo", body, tasks: ["대표 요청 접수", "담당 AI 검토", "산출물 업데이트"], time: getTime() }, ...state.messages] });
    setDraft("");
  }
  function reset() { localStorage.removeItem(STORAGE_KEY); setState(initialState); setDraft(""); }

  return (
    <div className="flex h-screen overflow-hidden bg-black text-zinc-100">
      <aside className="hidden w-72 shrink-0 border-r border-zinc-800 bg-zinc-950 md:flex md:flex-col">
        <div className="border-b border-zinc-800 p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase text-yellow-300">AI 프로젝트 운영 본부</p><h1 className="mt-1 text-lg font-bold text-white">{state.projectName}</h1></div><Bell size={18} className="text-zinc-400" /></div><button className="mt-4 flex h-9 w-full items-center gap-2 rounded-md bg-zinc-900 px-3 text-sm text-zinc-300"><Search size={15} /> 산출물 검색</button></div>
        <div className="flex-1 overflow-y-auto p-3"><p className="mb-2 px-2 text-xs font-semibold uppercase text-zinc-500">직무 채널</p><div className="space-y-1">{agents.map((agent) => <button key={agent.id} type="button" onClick={() => updateField("activeAgentId", agent.id)} className={classNames("flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm", state.activeAgentId === agent.id ? "bg-zinc-700 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white")}><Hash size={15} /> <span className="truncate">{agent.channel.replace("#", "")}</span></button>)}</div><p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase text-zinc-500">AI 직원</p><div className="space-y-2">{agents.map((agent) => <button key={agent.id} type="button" onClick={() => updateField("activeAgentId", agent.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-zinc-900"><AgentAvatar agent={agent} /><div className="min-w-0"><p className="truncate text-sm text-zinc-200">{agent.name}</p><p className="truncate text-xs text-zinc-500">{agent.title}</p></div></button>)}</div></div>
        <div className="border-t border-zinc-800 p-3"><button type="button" onClick={reset} className="h-9 w-full rounded-md border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900">초기화</button></div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-800 bg-black px-5 py-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold text-yellow-300">CEO가 지시하고, AI 부서가 산출물을 만드는 실무형 PM 시스템</p><h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">AI 프로젝트 운영 본부</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">단순 대화방이 아니라 요구사항, WBS, UML, API, QA, 리스크, 릴리즈를 한 프로젝트 흐름으로 연결합니다.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={runAllAgents} className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-300 px-4 text-sm font-bold text-black hover:bg-yellow-200"><Play size={16} /> 전체 AI 검토</button><button type="button" onClick={() => runAgent()} className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 px-4 text-sm font-semibold text-white hover:bg-zinc-900"><Bot size={16} /> 현재 AI 실행</button></div></div></header>
        <section className="grid border-b border-zinc-800 bg-zinc-950 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="p-4"><label className="text-xs font-semibold uppercase text-zinc-500">프로젝트 미션</label><textarea value={state.mission} onChange={(event) => updateField("mission", event.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-zinc-700 bg-black px-3 py-3 text-sm leading-6 text-zinc-100 outline-none focus:border-yellow-300" /></div><div className="border-t border-zinc-800 p-4 lg:border-l lg:border-t-0"><label className="text-xs font-semibold uppercase text-zinc-500">프로젝트 이름</label><input value={state.projectName} onChange={(event) => updateField("projectName", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-zinc-700 bg-black px-3 text-sm text-zinc-100 outline-none focus:border-yellow-300" /><div className="mt-3 flex items-center gap-2 text-sm text-zinc-400"><Users size={16} /> AI 직원 {agents.length}명 · 산출물 {boards.length - 2}종 · API 연동 4종</div></div></section>
        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-4 py-2">{boards.map((board) => { const Icon = board.icon; return <button key={board.id} type="button" onClick={() => updateField("activeBoard", board.id)} className={classNames("inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium", state.activeBoard === board.id ? "bg-yellow-300 text-black" : "text-zinc-300 hover:bg-zinc-800 hover:text-white")}><Icon size={15} />{board.label}</button>; })}</nav>
        <section className="flex min-h-0 flex-1"><div className="flex min-w-0 flex-1 flex-col">{state.activeBoard === "chat" ? <><div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3"><div className="flex items-center gap-3"><Hash size={19} className="text-zinc-500" /><div><p className="font-semibold text-white">{activeAgent.channel}</p><p className="text-xs text-zinc-500">{activeAgent.name} · {activeAgent.specialty}</p></div></div><div className="hidden items-center gap-2 text-sm text-zinc-500 sm:flex"><MessageSquare size={16} /> 응답 {currentMessages.length}개</div></div><div className="flex-1 overflow-y-auto bg-zinc-950 py-2">{currentMessages.map((message) => <Message key={message.id} message={message} />)}</div><form onSubmit={sendMessage} className="border-t border-zinc-800 bg-black p-4"><div className="flex items-end gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3 focus-within:border-yellow-300"><Brain size={20} className="mt-2 shrink-0 text-yellow-300" /><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`${activeAgent.name}에게 실무 지시하기...`} className="min-h-11 flex-1 resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-zinc-500" /><button type="submit" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-300 text-black hover:bg-yellow-200" aria-label="보내기"><Send size={17} /></button></div></form></> : <ArtifactBoard boardId={state.activeBoard} />}</div><RightPanel state={state} /></section>
      </main>
    </div>
  );
}