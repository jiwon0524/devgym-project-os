import { CalendarDays, CircleDot, Users } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge.jsx";

export function RightPanel({ project, tasks, team, activeView }) {
  const doneTasks = tasks.filter((task) => task.status === "Done" || task.status === "완료").length;
  const progress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <aside className="hidden h-screen w-80 shrink-0 border-l border-surface-line bg-white xl:block">
      <div className="border-b border-surface-line px-5 py-5">
        <p className="text-xs font-medium uppercase text-ink-muted">상세 정보</p>
        <h2 className="mt-2 text-base font-semibold text-ink-strong">
          {project?.name || "프로젝트 설정"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {project?.description ||
            "프로젝트를 먼저 만들면 요구사항, 작업, 일정, 팀 정보가 하나의 흐름으로 연결됩니다."}
        </p>
      </div>

      <div className="space-y-5 p-5">
        <section>
          <h3 className="text-sm font-semibold text-ink-strong">워크스페이스 흐름</h3>
          <div className="mt-3 space-y-3">
            {["생성", "요구사항", "작업", "팀"].map((step, index) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                    project || index === 0
                      ? "border-brand-line bg-brand-soft text-brand"
                      : "border-surface-line text-ink-faint"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={project || index === 0 ? "text-ink-base" : "text-ink-faint"}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-surface-line bg-surface-muted p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
            <CircleDot size={16} aria-hidden="true" />
            집중 영역
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {activeView === "requirements"
              ? "제품 아이디어를 기능, UI, API, 데이터베이스 요구사항으로 나눠 정리합니다."
              : "한 화면에는 하나의 목적만 담습니다. 프로젝트를 만든 뒤 탭으로 필요한 흐름만 이동합니다."}
          </p>
        </section>

        {project ? (
          <>
            <section>
              <h3 className="text-sm font-semibold text-ink-strong">속성</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-ink-muted">
                    <CalendarDays size={15} aria-hidden="true" />
                    단계
                  </dt>
                  <dd>
                    <StatusBadge value="In Progress" />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-ink-muted">
                    <Users size={15} aria-hidden="true" />
                    팀
                  </dt>
                  <dd className="font-medium text-ink-strong">{team.length}명</dd>
                </div>
              </dl>
            </section>

            <section>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-ink-strong">작업 진행률</span>
                <span className="font-medium text-ink-muted">{progress}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-surface-muted">
                <div
                  className="h-2 rounded-full bg-brand transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </aside>
  );
}
