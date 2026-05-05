import {
  Bell,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileText,
  GitBranch,
  Hash,
  Layers3,
  Megaphone,
  MessageSquare,
  PenTool,
  Play,
  Plus,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  Target,
  TestTube2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

const STORAGE_KEY = "ai-company-chat.v2";

const agents = [
  {
    id: "ceo",
    name: "박선혜",
    role: "CEO",
    title: "대표 비서",
    icon: Megaphone,
    color: "bg-orange-500",
    channel: "#ceo-briefing",
    specialty: "방향성, 우선순위, 의사결정",
  },
  {
    id: "cso",
    name: "김민지",
    role: "CSO",
    title: "전략 기획",
    icon: Target,
    color: "bg-sky-500",
    channel: "#strategy-room",
    specialty: "시장, 사용자, 제품 전략",
  },
  {
    id: "cpo",
    name: "유수민",
    role: "CPO",
    title: "제품 책임자",
    icon: FileText,
    color: "bg-blue-500",
    channel: "#product-prd",
    specialty: "PRD, 요구사항, 수용 기준",
  },
  {
    id: "cdo",
    name: "전병석",
    role: "CDO",
    title: "디자인 책임자",
    icon: PenTool,
    color: "bg-pink-500",
    channel: "#design-flow",
    specialty: "사용자 흐름, IA, 화면 설계",
  },
  {
    id: "cto",
    name: "장준구",
    role: "CTO",
    title: "기술 책임자",
    icon: Layers3,
    color: "bg-emerald-500",
    channel: "#tech-architecture",
    specialty: "아키텍처, API, 데이터 모델",
  },
  {
    id: "engineer",
    name: "정다영",
    role: "개발자",
    title: "풀스택 엔지니어",
    icon: Code2,
    color: "bg-violet-500",
    channel: "#dev-task-order",
    specialty: "구현, GitHub Issue, PR 연결",
  },
  {
    id: "qa",
    name: "박서현",
    role: "QA",
    title: "품질 책임자",
    icon: TestTube2,
    color: "bg-amber-500",
    channel: "#qa-release-gate",
    specialty: "테스트 케이스, 검증, 릴리즈 승인",
  },
  {
    id: "devops",
    name: "김선호",
    role: "DevOps",
    title: "운영 책임자",
    icon: Rocket,
    color: "bg-cyan-500",
    channel: "#deploy-ops",
    specialty: "배포, 보안, 환경변수, 모니터링",
  },
];

const initialState = {
  projectName: "AI 프로젝트 관리 회사",
  mission: "대학교에서 사용할 학사 도구를 만들고 싶어. 학생, 교수, 조교가 공지, 과제, 일정, 상담을 한 곳에서 협업하게 해줘.",
  activeAgentId: "cpo",
  messages: [
    {
      id: "m-1",
      agentId: "ceo",
      type: "summary",
      body: "대표님, 이 프로젝트는 일반 PM 도구가 아니라 AI 직원들이 부서별로 일하는 회사형 협업방으로 잡겠습니다.",
      tasks: ["프로젝트 미션 정리", "각 부서 역할 배정", "오늘 실행할 업무 큐 생성"],
      time: "오전 9:10",
    },
    {
      id: "m-2",
      agentId: "cto",
      type: "technical",
      body: "기술 관점에서는 Workspace, Project, Agent, Assignment, Deliverable, Comment를 핵심 데이터로 두는 게 좋습니다.",
      tasks: ["Supabase 저장 구조 설계", "GitHub Issue 연동 API 분리", "AI 호출은 서버 함수로 보호"],
      time: "오전 9:13",
    },
  ],
  done: ["CEO 미션 수집", "AI 직원 조직도 생성"],
};

function getTime() {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function getAgent(id) {
  return agents.find((agent) => agent.id === id) || agents[0];
}

function buildAgentReply(agent, state) {
  const project = state.projectName || "새 프로젝트";
  const mission = state.mission || "아직 미션이 입력되지 않았습니다.";

  const replies = {
    ceo: {
      body: `${project}의 대표 방향은 명확합니다. 사용자는 CEO이고, AI 직원들은 각 부서처럼 자기 업무를 맡아 결과물을 보고해야 합니다.`,
      tasks: ["오늘 결정할 3가지 뽑기", "보류할 기능 표시", "대표 승인 필요한 항목 정리"],
    },
    cso: {
      body: `전략팀 관점에서 미션은 '${mission}'입니다. 지금은 모든 기능보다 누구의 어떤 문제를 먼저 해결할지 좁혀야 합니다.`,
      tasks: ["핵심 사용자 1순위 정의", "경쟁 제품과 차별점 정리", "MVP 성공 기준 작성"],
    },
    cpo: {
      body: "제품팀은 PRD 초안을 만들겠습니다. 요구사항은 기능명이 아니라 사용자 행동, 예외 상황, 수용 기준까지 포함해야 합니다.",
      tasks: ["사용자 스토리 작성", "수용 기준 5개 생성", "요구사항 품질 점수화"],
    },
    cdo: {
      body: "디자인팀은 채팅방형 업무 공간을 기준으로 잡겠습니다. 왼쪽은 직원과 채널, 중앙은 업무 대화, 오른쪽은 산출물과 체크리스트가 좋습니다.",
      tasks: ["첫 화면 와이어프레임", "채널별 IA", "빈 상태와 로딩 상태 정리"],
    },
    cto: {
      body: "기술팀은 확장 가능한 SaaS 구조로 봅니다. AI 직원 실행 기록은 Assignment로, 결과물은 Deliverable로 저장해야 나중에 검색과 감사가 됩니다.",
      tasks: ["DB 테이블 초안", "권한 모델", "AI 작업 큐 설계"],
    },
    engineer: {
      body: "개발팀은 바로 이슈로 쪼갤 수 있습니다. 첫 구현은 UI, 두 번째는 저장, 세 번째는 실제 AI API, 네 번째는 GitHub 자동화입니다.",
      tasks: ["AI 직원 UI 구현", "Assignment 상태 변경", "GitHub Issue 생성 버튼"],
    },
    qa: {
      body: "QA팀은 릴리즈 기준을 먼저 고정하겠습니다. AI가 만든 산출물이 실행 가능한지, 권한이 맞는지, 사용자가 길을 잃지 않는지 검증해야 합니다.",
      tasks: ["수용 기준 테스트", "권한별 테스트", "릴리즈 체크리스트"],
    },
    devops: {
      body: "운영팀은 비밀키를 브라우저에 두지 않는 구조를 지키겠습니다. Kakao, GitHub, AI API 키는 서버 함수에서 처리해야 합니다.",
      tasks: ["환경변수 분리", "배포 URL 점검", "로그와 모니터링 계획"],
    },
  };

  return replies[agent.id];
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function AgentAvatar({ agent, size = "md" }) {
  const Icon = agent.icon;
  const sizeClass = size === "lg" ? "h-11 w-11" : "h-8 w-8";
  return (
    <div className={classNames("flex shrink-0 items-center justify-center rounded-md text-white", agent.color, sizeClass)}>
      <Icon size={size === "lg" ? 22 : 17} aria-hidden="true" />
    </div>
  );
}

function ChannelButton({ agent, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
        active ? "bg-zinc-700 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
      )}
    >
      <Hash size={15} aria-hidden="true" />
      <span className="truncate">{agent.channel.replace("#", "")}</span>
    </button>
  );
}

function Message({ message }) {
  const agent = getAgent(message.agentId);
  return (
    <article className="group flex gap-3 px-5 py-4 hover:bg-zinc-900/70">
      <AgentAvatar agent={agent} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="font-semibold text-white">{agent.name}-{agent.role}</h3>
          <span className="text-xs text-zinc-500">{agent.title}</span>
          <span className="text-xs text-zinc-500">{message.time}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-200">{message.body}</p>
        <div className="mt-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-zinc-400">
            <CheckCircle2 size={14} aria-hidden="true" />
            담당 업무
          </p>
          <ul className="space-y-1.5">
            {message.tasks.map((task) => (
              <li key={task} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-300" />
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function RightPanel({ state }) {
  const activeAgent = getAgent(state.activeAgentId);
  return (
    <aside className="hidden w-80 shrink-0 border-l border-zinc-800 bg-zinc-950 xl:block">
      <div className="border-b border-zinc-800 p-4">
        <p className="text-xs font-semibold uppercase text-zinc-500">현재 담당자</p>
        <div className="mt-3 flex items-center gap-3">
          <AgentAvatar agent={activeAgent} size="lg" />
          <div>
            <p className="font-semibold text-white">{activeAgent.name}-{activeAgent.role}</p>
            <p className="text-sm text-zinc-400">{activeAgent.specialty}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck size={16} className="text-emerald-400" aria-hidden="true" />
            오늘 완료
          </p>
          <div className="mt-3 space-y-2">
            {state.done.map((item) => (
              <div key={item} className="flex gap-2 text-sm text-zinc-300">
                <CheckCircle2 size={15} className="mt-0.5 text-emerald-400" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <GitBranch size={16} className="text-sky-400" aria-hidden="true" />
            다음 연결
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li>Supabase에 대화와 산출물 저장</li>
            <li>GitHub Issue 자동 생성</li>
            <li>실제 AI API로 부서별 답변 생성</li>
          </ul>
        </section>

        <section className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 p-4">
          <p className="text-sm font-semibold text-yellow-200">제품 방향</p>
          <p className="mt-2 text-sm leading-6 text-yellow-50/90">
            사용자는 한 명의 대표처럼 말하고, AI 6명 이상이 각자 직무별로 나누어 일하는 단톡방형 협업 OS입니다.
          </p>
        </section>
      </div>
    </aside>
  );
}

export default function AICompanyApp() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return initialState;
      const parsed = JSON.parse(saved);
      return {
        ...initialState,
        ...parsed,
        messages: Array.isArray(parsed.messages) ? parsed.messages : initialState.messages,
        done: Array.isArray(parsed.done) ? parsed.done : initialState.done,
        activeAgentId: agents.some((agent) => agent.id === parsed.activeAgentId) ? parsed.activeAgentId : "cpo",
      };
    } catch {
      return initialState;
    }
  });
  const [draft, setDraft] = useState("");

  const activeAgent = getAgent(state.activeAgentId);
  const currentMessages = useMemo(
    () => state.messages.filter((message) => message.agentId === state.activeAgentId || message.agentId === "ceo"),
    [state.activeAgentId, state.messages]
  );

  function persist(nextState) {
    setState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }

  function updateField(field, value) {
    persist({ ...state, [field]: value });
  }

  function runAgent(agentId = state.activeAgentId) {
    const agent = getAgent(agentId);
    const reply = buildAgentReply(agent, state);
    const message = {
      id: `${agentId}-${Date.now()}`,
      agentId,
      type: "agent",
      body: reply.body,
      tasks: reply.tasks,
      time: getTime(),
    };
    persist({
      ...state,
      activeAgentId: agentId,
      messages: [message, ...state.messages],
      done: Array.from(new Set([...state.done, `${agent.role} 업무 배정`])).slice(-5),
    });
  }

  function sendCeoMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const ceoMessage = {
      id: `ceo-${Date.now()}`,
      agentId: "ceo",
      type: "ceo",
      body,
      tasks: ["대표 요청 접수", "담당 부서 검토", "후속 업무 분배"],
      time: getTime(),
    };
    const reply = buildAgentReply(activeAgent, { ...state, mission: body });
    const agentMessage = {
      id: `${activeAgent.id}-${Date.now()}`,
      agentId: activeAgent.id,
      type: "agent",
      body: reply.body,
      tasks: reply.tasks,
      time: getTime(),
    };
    persist({ ...state, mission: body, messages: [agentMessage, ceoMessage, ...state.messages] });
    setDraft("");
  }

  function startAllHands() {
    const nextMessages = agents
      .filter((agent) => agent.id !== "ceo")
      .map((agent) => {
        const reply = buildAgentReply(agent, state);
        return {
          id: `${agent.id}-${Date.now()}`,
          agentId: agent.id,
          type: "agent",
          body: reply.body,
          tasks: reply.tasks,
          time: getTime(),
        };
      });
    persist({
      ...state,
      messages: [...nextMessages, ...state.messages],
      done: ["전체 AI 직원 업무 배정", "부서별 산출물 생성", ...state.done].slice(0, 5),
    });
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
    setDraft("");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black text-zinc-100">
      <aside className="hidden w-72 shrink-0 border-r border-zinc-800 bg-zinc-950 md:flex md:flex-col">
        <div className="border-b border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-yellow-300">AI 회사 단톡방</p>
              <h1 className="mt-1 text-lg font-bold text-white">{state.projectName}</h1>
            </div>
            <Bell size={18} className="text-zinc-400" aria-hidden="true" />
          </div>
          <button className="mt-4 flex h-9 w-full items-center justify-between rounded-md bg-zinc-900 px-3 text-sm text-zinc-300">
            <span className="flex items-center gap-2"><Search size={15} /> 회사 검색</span>
            <ChevronDown size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase text-zinc-500">직무별 채널</p>
          <div className="space-y-1">
            {agents.map((agent) => (
              <ChannelButton
                key={agent.id}
                agent={agent}
                active={state.activeAgentId === agent.id}
                onClick={() => updateField("activeAgentId", agent.id)}
              />
            ))}
          </div>

          <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase text-zinc-500">직원</p>
          <div className="space-y-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => updateField("activeAgentId", agent.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-zinc-900"
              >
                <AgentAvatar agent={agent} />
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-200">{agent.name}-{agent.role}</p>
                  <p className="truncate text-xs text-zinc-500">{agent.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-800 p-3">
          <button
            type="button"
            onClick={reset}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            <Plus size={15} /> 새 회사로 초기화
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-800 bg-black px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex bg-yellow-300 px-3 py-1 text-2xl font-black text-black sm:text-3xl">
                AI 6명이 단톡방에서
              </div>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">진짜 팀처럼 일한다</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                대표는 한 줄로 지시하고, PM·디자이너·CTO·개발자·QA·운영 AI가 각자 업무를 받아 채널에서 보고합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startAllHands}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-300 px-4 text-sm font-bold text-black hover:bg-yellow-200"
              >
                <Play size={16} /> 전체 직원 호출
              </button>
              <button
                type="button"
                onClick={() => runAgent()}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-700 px-4 text-sm font-semibold text-white hover:bg-zinc-900"
              >
                <Bot size={16} /> 현재 직원 실행
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-0 border-b border-zinc-800 bg-zinc-950 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-4">
            <label className="text-xs font-semibold uppercase text-zinc-500">대표 미션</label>
            <textarea
              value={state.mission}
              onChange={(event) => updateField("mission", event.target.value)}
              className="mt-2 min-h-20 w-full rounded-lg border border-zinc-700 bg-black px-3 py-3 text-sm leading-6 text-zinc-100 outline-none focus:border-yellow-300"
            />
          </div>
          <div className="border-t border-zinc-800 p-4 lg:border-l lg:border-t-0">
            <label className="text-xs font-semibold uppercase text-zinc-500">프로젝트 이름</label>
            <input
              value={state.projectName}
              onChange={(event) => updateField("projectName", event.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-zinc-700 bg-black px-3 text-sm text-zinc-100 outline-none focus:border-yellow-300"
            />
            <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
              <Users size={16} /> AI 직원 {agents.length}명 대기 중
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
              <div className="flex items-center gap-3">
                <Hash size={19} className="text-zinc-500" />
                <div>
                  <p className="font-semibold text-white">{activeAgent.channel}</p>
                  <p className="text-xs text-zinc-500">{activeAgent.name}-{activeAgent.role} · {activeAgent.specialty}</p>
                </div>
              </div>
              <div className="hidden items-center gap-2 text-sm text-zinc-500 sm:flex">
                <MessageSquare size={16} /> 응답 {currentMessages.length}개
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-zinc-950 py-2">
              {currentMessages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
            </div>

            <form onSubmit={sendCeoMessage} className="border-t border-zinc-800 bg-black p-4">
              <div className="flex items-end gap-3 rounded-xl border border-zinc-700 bg-zinc-950 p-3 focus-within:border-yellow-300">
                <Brain size={20} className="mt-2 shrink-0 text-yellow-300" />
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`${activeAgent.name}-${activeAgent.role}에게 지시하기...`}
                  className="min-h-11 flex-1 resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-zinc-500"
                />
                <button
                  type="submit"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-300 text-black hover:bg-yellow-200"
                  aria-label="보내기"
                >
                  <Send size={17} />
                </button>
              </div>
            </form>
          </div>
          <RightPanel state={state} />
        </section>
      </main>
    </div>
  );
}