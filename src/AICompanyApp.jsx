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
  Sparkles,
  Table2,
  Target,
  TestTube2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "ai-company-ops.v7";
const APP_VERSION = "2026.05.06-autonomous-company";

const agents = [
  { id: "ceo", name: "대표총괄AI", role: "CEO", title: "목표/우선순위/승인", icon: Megaphone, color: "bg-orange-500", channel: "#대표-브리핑", specialty: "대표 요청을 해석하고 부서별 업무를 자동 배정" },
  { id: "strategy", name: "전략기획AI", role: "전략", title: "시장/범위/MVP", icon: Target, color: "bg-sky-500", channel: "#전략-기획", specialty: "사용자 문제, MVP 범위, 성공 지표 정리" },
  { id: "pm", name: "요구사항AI", role: "PM", title: "PRD/요구사항", icon: FileText, color: "bg-blue-500", channel: "#요구사항-prd", specialty: "요구사항, 수용 기준, 변경 영향 분석" },
  { id: "ux", name: "UX설계AI", role: "UX", title: "화면/흐름/UML", icon: PenTool, color: "bg-pink-500", channel: "#ux-uml", specialty: "사용자 흐름, 화면 IA, UML 사용 목적" },
  { id: "arch", name: "기술설계AI", role: "아키텍트", title: "API/DB/보안", icon: Layers3, color: "bg-emerald-500", channel: "#기술-설계", specialty: "아키텍처, API, DB, 권한 정책" },
  { id: "dev", name: "개발관리AI", role: "개발", title: "WBS/GitHub/PR", icon: Code2, color: "bg-violet-500", channel: "#개발-wbs", specialty: "작업 분해, GitHub Issue, PR 상태 연결" },
  { id: "qa", name: "품질검증AI", role: "QA", title: "TC/결함/릴리즈", icon: TestTube2, color: "bg-amber-500", channel: "#qa-검증", specialty: "테스트 케이스, 결함, 릴리즈 게이트" },
  { id: "ops", name: "배포운영AI", role: "운영", title: "배포/알림/모니터링", icon: Rocket, color: "bg-cyan-500", channel: "#배포-운영", specialty: "배포 체크, 알림, 운영 로그, API 연결" },
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
  { id: "integrations", label: "연결 설정", icon: GitBranch },
  { id: "final", label: "최종본", icon: CheckCircle2 },
];

function getTime() {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date());
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function getAgent(id) {
  return agents.find((agent) => agent.id === id) || agents[0];
}

function projectKeyword(mission) {
  if (mission.includes("동의대학교") || mission.includes("학사")) return "동의대학교 학사 시스템";
  if (mission.includes("쇼핑")) return "커머스 운영 시스템";
  if (mission.includes("병원")) return "병원 예약 시스템";
  return "프로젝트 관리 시스템";
}

function makeArtifacts(state) {
  const subject = projectKeyword(state.mission);
  const project = state.projectName || subject;

  return {
    prd: [
      { title: "1. 문제 정의", body: `${subject}에서 학생, 교수, 조교가 공지, 과제, 출결, 상담 일정을 여러 채널로 확인하면서 누락과 중복 문의가 발생합니다.` },
      { title: "2. 사용자와 권한", body: "학생은 과제 확인/제출/상담 예약, 교수는 공지/과제/평가 관리, 조교는 수업 운영 보조, 관리자는 학기/과목/권한을 관리합니다." },
      { title: "3. 핵심 요구사항", body: "과목별 공지, 과제 제출, 제출 상태 추적, 상담 예약, 알림, 활동 로그, 권한별 화면 분리를 MVP 범위로 둡니다." },
      { title: "4. 수용 기준", body: "학생은 로그인 후 3초 안에 오늘 해야 할 일을 확인하고, 교수는 과제 생성 후 대상 학생에게 알림이 예약되었는지 확인할 수 있어야 합니다." },
      { title: "5. 성공 지표", body: "과제 누락 문의 40% 감소, 공지 미확인율 30% 감소, 상담 예약 처리 시간 50% 단축을 1차 목표로 둡니다." },
    ],
    wbs: [
      { title: "TASK-001 인증/권한", body: "카카오/Supabase Auth, 학생/교수/조교/관리자 역할, RLS 정책, 초대 코드 기반 가입을 구현합니다." },
      { title: "TASK-002 과목 워크스페이스", body: "학기, 과목, 분반, 멤버 초대, 역할 변경, 활동 로그를 연결합니다." },
      { title: "TASK-003 공지/과제", body: "공지 작성, 첨부파일, 과제 생성, 마감일, 제출 상태, 교수 피드백을 구현합니다." },
      { title: "TASK-004 상담/일정", body: "교수 가능 시간, 학생 예약, 변경 알림, 캘린더 뷰를 구현합니다." },
      { title: "TASK-005 자동화/알림", body: "중요 변경 시 AI 직원 알림, 사용자 알림, GitHub Issue/PR 상태 연결을 구현합니다." },
    ],
    uml: [
      { title: "Use Case", body: "학생: 과제 확인/제출/상담 예약. 교수: 공지/과제/평가 관리. 조교: 제출 현황 점검. 관리자: 학기/과목/권한 관리." },
      { title: "Class Diagram", body: "User, Workspace, Course, CourseMember, Notice, Assignment, Submission, Appointment, Notification, ActivityLog가 핵심 클래스입니다." },
      { title: "Sequence", body: "교수가 과제를 생성하면 Assignment가 저장되고 NotificationJob이 생성되며, 학생 제출 시 Submission과 ActivityLog가 갱신됩니다." },
      { title: "ERD", body: "workspaces 1:N courses, courses 1:N assignments/notices, assignments 1:N submissions, users N:M course_members 구조입니다." },
    ],
    api: [
      { title: "POST /courses/:id/notices", body: "교수/조교 권한만 공지 생성 가능. 생성 후 NotificationJob과 ActivityLog를 함께 만듭니다." },
      { title: "POST /assignments/:id/submissions", body: "학생 권한으로 제출 파일과 메모를 저장하고, 마감 상태와 재제출 가능 여부를 검증합니다." },
      { title: "GET /dashboard/todos", body: "로그인 사용자의 오늘 할 일, 미확인 공지, 마감 임박 과제, 상담 일정을 우선순위로 반환합니다." },
      { title: "DB 테이블", body: "profiles, workspaces, workspace_members, courses, course_members, notices, assignments, submissions, appointments, notifications, agent_runs, deliverables." },
    ],
    qa: [
      { title: "권한 테스트", body: "학생은 다른 학생 제출물을 볼 수 없고, 교수는 본인 과목만 관리할 수 있어야 합니다." },
      { title: "마감 테스트", body: "마감 전/후 제출, 지각 제출 허용 여부, 파일 업로드 실패, 모바일 제출 흐름을 검증합니다." },
      { title: "알림 테스트", body: "공지/과제/상담 변경 알림이 중복 없이 발송되고 실패 시 재시도 큐에 들어가는지 확인합니다." },
      { title: "릴리즈 게이트", body: "P0 결함 0개, P1 결함 승인 처리, 주요 smoke test 통과, RLS 정책 검증 완료가 배포 조건입니다." },
    ],
    risk: [
      { title: "개인정보", body: "학번, 상담 내용, 제출물은 권한과 감사 로그가 필요합니다. Supabase RLS를 먼저 완성해야 합니다." },
      { title: "알림 과부하", body: "모든 변경을 즉시 보내면 사용자가 피로해집니다. 중요도와 묶음 알림 정책이 필요합니다." },
      { title: "학사 정책 차이", body: "학과/과목마다 마감, 지각 제출, 조교 권한이 다릅니다. 설정 가능한 정책 모델이 필요합니다." },
      { title: "AI 자동화 신뢰성", body: "AI가 만든 산출물은 최종 승인 전까지 초안 상태로 두고, 담당자 승인 로그를 남겨야 합니다." },
    ],
    release: [
      { title: "Alpha", body: "단일 학과/단일 과목으로 공지, 과제, 제출, 권한 모델을 검증합니다." },
      { title: "Beta", body: "여러 과목, 조교 협업, 상담 예약, 알림 재시도, GitHub Issue 연결을 붙입니다." },
      { title: "Production", body: "관리자 콘솔, 백업, 모니터링, 개인정보 처리방침, 운영 로그, 장애 대응 절차를 준비합니다." },
      { title: "운영 체크", body: "환경변수, Supabase RLS, Kakao Redirect URL, GitHub Webhook, AI API 사용량 제한을 점검합니다." },
    ],
    integrations: [
      { title: "1. AI API", body: "OpenAI API Key를 서버 환경변수에 넣고, 직원별 role/context를 서버에서 조합해 응답을 생성합니다. 브라우저에는 키를 넣지 않습니다." },
      { title: "2. Supabase", body: "Project URL, publishable key, RLS 정책, agent_runs/deliverables/notifications 테이블을 연결합니다." },
      { title: "3. GitHub App 또는 OAuth", body: "Repository 접근, Issue 생성, PR 상태 수신, commit message의 TASK-001 자동 연결을 위해 GitHub App이 가장 좋습니다." },
      { title: "4. Kakao", body: "로그인은 Supabase Auth Provider로, 카카오톡 초대/메시지는 심사 후 서버 함수에서 발송하도록 분리합니다." },
    ],
    final: [
      { title: "최종 요구서 요약", body: `${project}는 학사 운영의 공지, 과제, 제출, 상담, 알림을 한 곳에서 관리하고 권한별로 안전하게 분리하는 협업형 학사 SaaS입니다.` },
      { title: "개발 착수 범위", body: "인증/권한, 과목 워크스페이스, 공지/과제, 제출 상태, 상담 예약, 알림, 활동 로그, GitHub Issue 연결까지 1차 범위로 잡습니다." },
      { title: "검증 기준", body: "요구사항마다 수용 기준과 테스트 케이스가 연결되어야 하며, 변경 시 WBS/API/QA/리스크가 자동으로 영향받음 상태가 되어야 합니다." },
      { title: "다음 실행", body: "Supabase 스키마와 RLS를 적용한 뒤 AI API, GitHub App, Kakao Auth 순서로 연결하면 실제 협업 서비스로 확장할 수 있습니다." },
    ],
  };
}

const initialState = {
  projectName: "동의대학교 학사 협업 OS",
  mission: "동의대학교 학사 시스템을 진행해. 학생, 교수, 조교가 공지, 과제, 출결, 상담, 알림을 한 곳에서 관리하는 실무형 SaaS로 만들어줘.",
  activeAgentId: "ceo",
  activeBoard: "chat",
  version: APP_VERSION,
  automationEnabled: true,
  bootstrapped: false,
  messages: [],
  notifications: [
    { id: "n-0", title: "자동 운영 대기", body: "프로젝트 목표를 입력하면 AI 직원들이 자동으로 산출물을 생성합니다.", time: getTime(), tone: "info" },
  ],
  automationLog: [],
  done: ["실무형 산출물 보드 준비", "AI 직원 역할 정의"],
};

function selectAgentsForCommand(command) {
  const text = command.toLowerCase();
  if (text.includes("api") || text.includes("연동") || text.includes("github") || text.includes("깃허브")) return ["ceo", "arch", "dev", "ops", "qa"];
  if (text.includes("uml") || text.includes("설계") || text.includes("erd")) return ["ceo", "ux", "arch", "pm"];
  if (text.includes("테스트") || text.includes("qa") || text.includes("릴리즈")) return ["ceo", "qa", "dev", "ops"];
  if (text.includes("부족") || text.includes("개선") || text.includes("실무") || text.includes("현업")) return ["ceo", "strategy", "pm", "ux", "arch", "dev", "qa"];
  return ["ceo", "strategy", "pm", "ux", "arch", "dev", "qa", "ops"];
}

function buildAgentReply(agent, command, state, index) {
  const subject = projectKeyword(command || state.mission);
  const prefix = index === 0 ? "대표 요청을 접수했습니다." : "앞 부서 결과를 이어받아 제 담당 산출물로 구체화했습니다.";
  const replies = {
    ceo: { body: `${prefix} ${subject}는 대화만 하는 화면이 아니라 산출물이 남는 운영 본부로 진행해야 합니다. 지금부터 각 부서에 PRD, WBS, UML, API, QA, 리스크, 릴리즈 작업을 자동 배정합니다.`, tasks: ["프로젝트 목표 확정", "AI 부서 자동 배정", "최종본 생성 기준 설정"] },
    strategy: { body: `${subject}의 1차 고객은 학생과 교수입니다. 차별점은 자유 메모가 아니라 요구사항, 작업, 테스트, 알림이 연결되는 추적 가능성입니다.`, tasks: ["핵심 사용자 정의", "MVP 범위 제한", "성공 지표 설정"] },
    pm: { body: "요구사항은 기능명이 아니라 검증 가능한 문장이어야 합니다. 공지 미확인, 과제 누락, 상담 예약 지연을 줄이는 요구서로 정리했습니다.", tasks: ["PRD 초안 생성", "수용 기준 작성", "변경 영향 분석 항목 연결"] },
    ux: { body: "사용자는 AI 직원 대화를 보는 것이 아니라 지금 만들어진 요구서, WBS, UML, QA 결과를 빠르게 확인해야 합니다. 그래서 최종본 탭과 알림 흐름을 분리했습니다.", tasks: ["역할별 화면 흐름 정의", "UML 사용 목적 카드 작성", "최종본 확인 동선 정리"] },
    arch: { body: "기술 구조는 Supabase 기반 워크스페이스 권한, deliverables 저장, notifications 기록, GitHub webhook 수신 구조가 필요합니다.", tasks: ["DB 테이블 후보 정리", "API 경계 정의", "RLS/권한 리스크 표시"] },
    dev: { body: "WBS는 GitHub Issue로 바로 옮길 수 있게 TASK ID 중심으로 쪼개야 합니다. PR 상태와 TASK 상태가 연결되도록 준비합니다.", tasks: ["TASK-001~005 분해", "GitHub Issue 매핑", "PR 상태 자동 반영 설계"] },
    qa: { body: "실무 사용 가능성을 보려면 권한, 마감, 알림, 모바일 제출 실패 케이스를 먼저 검증해야 합니다. QA 게이트를 산출물에 반영했습니다.", tasks: ["권한 테스트 정의", "마감/알림 테스트 정의", "릴리즈 승인 기준 작성"] },
    ops: { body: "운영 관점에서는 API 키를 브라우저에 두지 않고 서버 함수와 환경변수로 분리해야 합니다. 연결해야 할 API 목록을 정리했습니다.", tasks: ["필수 API 연결 목록 작성", "환경변수 점검", "운영 알림 정책 정리"] },
  };
  return replies[agent.id];
}

function buildCollaborativeRun(command, state, reason = "대표 명령") {
  const selectedIds = selectAgentsForCommand(command);
  const timestamp = Date.now();
  const messages = selectedIds.map((agentId, index) => {
    const agent = getAgent(agentId);
    const reply = buildAgentReply(agent, command, state, index);
    return {
      id: `${agentId}-${timestamp}-${index}`,
      agentId,
      body: reply.body,
      tasks: reply.tasks,
      time: getTime(),
    };
  });
  const log = {
    id: `log-${timestamp}`,
    title: reason,
    body: `${selectedIds.map((id) => getAgent(id).name).join(" → ")} 순서로 업무가 자동 진행되었습니다.`,
    time: getTime(),
  };
  const notifications = [
    { id: `n-${timestamp}-1`, title: "AI 직원 업무 배정 완료", body: `${selectedIds.length}개 부서가 프로젝트를 나눠 맡았습니다.`, time: getTime(), tone: "success" },
    { id: `n-${timestamp}-2`, title: "산출물 갱신", body: "요구서, WBS, UML, API/DB, QA, 리스크, 릴리즈, 최종본이 현재 목표 기준으로 준비되었습니다.", time: getTime(), tone: "info" },
  ];
  return { selectedIds, messages, log, notifications };
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

function ArtifactBoard({ boardId, state }) {
  const artifacts = makeArtifacts(state);
  const rows = artifacts[boardId] || [];
  const board = boards.find((item) => item.id === boardId);
  const Icon = board?.icon || FileText;
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-zinc-800 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-yellow-300"><Icon size={20} /></div>
          <div>
            <h2 className="text-lg font-semibold text-white">{board?.label} 산출물</h2>
            <p className="text-sm text-zinc-500">{state.projectName} 기준으로 AI 직원들이 자동 작성한 실무 문서입니다.</p>
          </div>
        </div>
        {boardId === "final" && <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">대표 검토용 최종본</span>}
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
    { name: "OpenAI API", status: "필수", detail: "AI 직원 응답과 산출물 생성을 서버에서 처리합니다. OPENAI_API_KEY는 서버 환경변수에만 저장합니다." },
    { name: "Supabase", status: "필수", detail: "Auth, DB, RLS, agent_runs, deliverables, notifications, workspace_members 저장소로 사용합니다." },
    { name: "GitHub App", status: "권장", detail: "Issue 생성, PR 상태 동기화, TASK-001 커밋 자동 연결은 OAuth보다 GitHub App이 운영에 유리합니다." },
    { name: "Kakao", status: "나중", detail: "로그인은 Supabase Kakao Provider, 초대/메시지는 심사 후 Edge Function에서 분리 발송합니다." },
  ];
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-white"><GitBranch size={16} className="text-yellow-300" />연결해야 할 API</p>
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
      <div className="space-y-4 overflow-y-auto p-4">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><Bell size={16} className="text-yellow-300" />실시간 알림</p>
          <div className="mt-3 space-y-3">
            {state.notifications.map((item) => <div key={item.id} className="rounded-md border border-zinc-800 bg-black p-3"><p className="text-sm font-semibold text-zinc-100">{item.title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{item.body}</p><p className="mt-2 text-xs text-zinc-600">{item.time}</p></div>)}
          </div>
        </section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-white"><ListChecks size={16} className="text-emerald-400" />자동화 로그</p>
          <div className="mt-3 space-y-3">
            {state.automationLog.map((item) => <div key={item.id} className="rounded-md border border-zinc-800 bg-black p-3"><p className="text-sm font-semibold text-zinc-100">{item.title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{item.body}</p><p className="mt-2 text-xs text-zinc-600">{item.time}</p></div>)}
          </div>
        </section>
        <IntegrationChecklist />
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
  const autoTimer = useRef(null);
  const activeAgent = getAgent(state.activeAgentId);
  const currentMessages = useMemo(() => state.messages.filter((message) => message.agentId === state.activeAgentId || message.agentId === "ceo"), [state.activeAgentId, state.messages]);

  function persist(nextState) {
    setState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  function applyRun(command, reason = "대표 명령") {
    const run = buildCollaborativeRun(command, state, reason);
    const ceoCommand = {
      id: `ceo-command-${Date.now()}`,
      agentId: "ceo",
      body: command,
      tasks: ["대표 명령 접수", "관련 AI 자동 배정", "최종 산출물 갱신"],
      time: getTime(),
    };
    persist({
      ...state,
      mission: command,
      activeBoard: reason.includes("자동") ? "final" : "chat",
      activeAgentId: run.selectedIds[run.selectedIds.length - 1] || state.activeAgentId,
      version: APP_VERSION,
      bootstrapped: true,
      messages: [...run.messages, ceoCommand, ...state.messages].slice(0, 60),
      notifications: [...run.notifications, ...state.notifications].slice(0, 8),
      automationLog: [run.log, ...state.automationLog].slice(0, 8),
      done: ["최종본 갱신", "부서별 산출물 자동 생성", "대표 알림 발송", ...state.done].slice(0, 6),
    });
  }

  function updateField(field, value) {
    const nextState = { ...state, [field]: value, version: APP_VERSION };
    persist(nextState);
    if (field === "mission" && state.automationEnabled) {
      window.clearTimeout(autoTimer.current);
      autoTimer.current = window.setTimeout(() => {
        const latest = localStorage.getItem(STORAGE_KEY);
        const parsed = latest ? JSON.parse(latest) : nextState;
        const run = buildCollaborativeRun(value, parsed, "프로젝트 목표 변경 자동 반영");
        const updated = {
          ...parsed,
          activeBoard: "final",
          activeAgentId: run.selectedIds[run.selectedIds.length - 1] || parsed.activeAgentId,
          messages: [...run.messages, ...parsed.messages].slice(0, 60),
          notifications: [...run.notifications, ...parsed.notifications].slice(0, 8),
          automationLog: [run.log, ...parsed.automationLog].slice(0, 8),
          done: ["프로젝트 목표 자동 반영", "최종본 갱신", ...parsed.done].slice(0, 6),
          bootstrapped: true,
          version: APP_VERSION,
        };
        setState(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }, 900);
    }
  }

  function sendMessage(event) {
    event.preventDefault();
    const command = draft.trim();
    if (!command) return;
    applyRun(command, "대표 명령");
    setDraft("");
  }

  function runAgent(agentId = state.activeAgentId) {
    const agent = getAgent(agentId);
    const reply = buildAgentReply(agent, state.mission, state, 1);
    persist({
      ...state,
      activeAgentId: agentId,
      activeBoard: "chat",
      messages: [{ id: `${agentId}-${Date.now()}`, agentId, body: reply.body, tasks: reply.tasks, time: getTime() }, ...state.messages].slice(0, 60),
      notifications: [{ id: `n-agent-${Date.now()}`, title: `${agent.name} 산출물 갱신`, body: reply.tasks.join(" · "), time: getTime(), tone: "info" }, ...state.notifications].slice(0, 8),
      version: APP_VERSION,
    });
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
    setDraft("");
  }

  useEffect(() => {
    if (!state.bootstrapped && state.automationEnabled) {
      const timer = window.setTimeout(() => applyRun(state.mission, "초기 자동 운영"), 300);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.bootstrapped, state.automationEnabled]);

  return (
    <div className="flex h-screen overflow-hidden bg-black text-zinc-100">
      <aside className="hidden w-72 shrink-0 border-r border-zinc-800 bg-zinc-950 md:flex md:flex-col">
        <div className="border-b border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold uppercase text-yellow-300">AI 회사 운영 본부</p><h1 className="mt-1 text-lg font-bold text-white">{state.projectName}</h1></div>
            <Bell size={18} className="text-zinc-400" />
          </div>
          <button className="mt-4 flex h-9 w-full items-center gap-2 rounded-md bg-zinc-900 px-3 text-sm text-zinc-300"><Search size={15} />산출물 검색</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase text-zinc-500">직무 채널</p>
          <div className="space-y-1">{agents.map((agent) => <button key={agent.id} type="button" onClick={() => updateField("activeAgentId", agent.id)} className={classNames("flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm", state.activeAgentId === agent.id ? "bg-zinc-700 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white")}><Hash size={15} /><span className="truncate">{agent.channel.replace("#", "")}</span></button>)}</div>
          <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase text-zinc-500">AI 직원</p>
          <div className="space-y-2">{agents.map((agent) => <button key={agent.id} type="button" onClick={() => updateField("activeAgentId", agent.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-zinc-900"><AgentAvatar agent={agent} /><div className="min-w-0"><p className="truncate text-sm text-zinc-200">{agent.name}</p><p className="truncate text-xs text-zinc-500">{agent.title}</p></div></button>)}</div>
        </div>
        <div className="border-t border-zinc-800 p-3"><button type="button" onClick={reset} className="h-9 w-full rounded-md border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900">초기화</button></div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-800 bg-black px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-yellow-300"><Sparkles size={16} />대표가 목표를 말하면 AI 직원들이 자동으로 산출물을 만듭니다</p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">AI 프로젝트 운영 본부</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">대화, 알림, 요구서, WBS, UML, API/DB, QA, 리스크, 릴리즈, 최종본이 한 흐름으로 이어집니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => applyRun(state.mission, "전체 산출물 수동 갱신")} className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-300 px-4 text-sm font-bold text-black hover:bg-yellow-200"><Brain size={16} />전체 산출물 갱신</button>
              <button type="button" onClick={() => runAgent()} className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 px-4 text-sm font-semibold text-white hover:bg-zinc-900"><Bot size={16} />선택 AI에게 지시</button>
            </div>
          </div>
        </header>

        <section className="grid border-b border-zinc-800 bg-zinc-950 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-4"><label className="text-xs font-semibold uppercase text-zinc-500">대표 명령 / 프로젝트 목표</label><textarea value={state.mission} onChange={(event) => updateField("mission", event.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-zinc-700 bg-black px-3 py-3 text-sm leading-6 text-zinc-100 outline-none focus:border-yellow-300" /></div>
          <div className="border-t border-zinc-800 p-4 lg:border-l lg:border-t-0"><label className="text-xs font-semibold uppercase text-zinc-500">프로젝트 이름</label><input value={state.projectName} onChange={(event) => updateField("projectName", event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-zinc-700 bg-black px-3 text-sm text-zinc-100 outline-none focus:border-yellow-300" /><div className="mt-3 flex items-center gap-2 text-sm text-zinc-400"><Users size={16} />AI 직원 {agents.length}명 · 산출물 {boards.length - 2}종 · 자동 알림 {state.notifications.length}개</div></div>
        </section>

        <nav className="flex gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-4 py-2">{boards.map((board) => { const Icon = board.icon; return <button key={board.id} type="button" onClick={() => updateField("activeBoard", board.id)} className={classNames("inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium", state.activeBoard === board.id ? "bg-yellow-300 text-black" : "text-zinc-300 hover:bg-zinc-800 hover:text-white")}><Icon size={15} />{board.label}</button>; })}</nav>

        <section className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            {state.activeBoard === "chat" ? <>
              <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3"><div className="flex items-center gap-3"><Hash size={19} className="text-zinc-500" /><div><p className="font-semibold text-white">{activeAgent.channel}</p><p className="text-xs text-zinc-500">{activeAgent.name} · {activeAgent.specialty}</p></div></div><div className="hidden items-center gap-2 text-sm text-zinc-500 sm:flex"><MessageSquare size={16} />응답 {currentMessages.length}개</div></div>
              <div className="flex-1 overflow-y-auto bg-zinc-950 py-2">{currentMessages.map((message) => <Message key={message.id} message={message} />)}</div>
              <form onSubmit={sendMessage} className="border-t border-zinc-800 bg-black p-4"><div className="flex items-end gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3 focus-within:border-yellow-300"><Brain size={20} className="mt-2 shrink-0 text-yellow-300" /><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="대표 명령 입력: 예) 동의대학교 학사 시스템에서 과제 제출 흐름을 더 실무적으로 만들어줘" className="min-h-11 flex-1 resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-zinc-500" /><button type="submit" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-300 text-black hover:bg-yellow-200" aria-label="보내기"><Send size={17} /></button></div></form>
            </> : <ArtifactBoard boardId={state.activeBoard} state={state} />}
          </div>
          <RightPanel state={state} />
        </section>
      </main>
    </div>
  );
}
