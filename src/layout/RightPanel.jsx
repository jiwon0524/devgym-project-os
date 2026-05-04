import { CalendarDays, CircleDot, ShieldCheck, Users } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { ActivityList } from "../features/activity/ActivityList.jsx";
import { CommentsPanel } from "../features/comments/CommentsPanel.jsx";
import { getRoleLabel } from "../features/permissions/permissions.js";
import { OnlineMembers } from "../features/team/OnlineMembers.jsx";

export function RightPanel({
  project,
  tasks,
  team,
  activeWorkspace,
  currentUser,
  currentRole,
  comments = [],
  onAddComment,
  onEditComment,
  onDeleteComment,
  activities = [],
  activeView,
  backendMode,
  realtimeStatus,
  collaborationSignals = [],
}) {
  const doneTasks = tasks.filter((task) => task.status === "Done" || task.status === "완료").length;
  const progress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <aside className="hidden h-screen w-80 shrink-0 overflow-y-auto border-l border-surface-line bg-white xl:block">
      <div className="border-b border-surface-line px-5 py-5">
        <p className="text-xs font-medium uppercase text-ink-muted">협업 패널</p>
        <h2 className="mt-2 text-base font-semibold text-ink-strong">
          {activeWorkspace?.name || project?.name || "프로젝트 설정"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {project?.description ||
            "프로젝트를 먼저 만들면 요구사항, 작업, 일정, 팀 정보가 하나의 흐름으로 연결됩니다."}
        </p>
      </div>

      <div className="space-y-6 p-5">
        <OnlineMembers members={team} />

        <section className="rounded-lg border border-surface-line bg-surface-muted p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
            <CircleDot size={16} aria-hidden="true" />
            실시간 상태
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {backendMode === "supabase"
              ? realtimeStatus === "SUBSCRIBED"
                ? "Supabase Realtime으로 요구사항, 작업, 댓글, 활동 변경을 구독하고 있습니다."
                : "Supabase Realtime 연결을 준비하고 있습니다."
              : activeView === "requirements"
                ? "Mock 모드에서는 팀원이 같은 요구사항을 보고 있다는 전제로 편집 상태와 최근 변경을 보여줍니다."
                : "Supabase 환경변수를 설정하면 presence와 변경 이벤트가 실시간으로 반영됩니다."}
          </p>
        </section>

        {collaborationSignals.length ? (
          <section className="rounded-lg border border-surface-line bg-white p-4">
            <h3 className="text-sm font-semibold text-ink-strong">실시간 편집 신호</h3>
            <div className="mt-3 space-y-2">
              {collaborationSignals.slice(0, 4).map((signal) => (
                <div key={signal.id} className="rounded-lg bg-surface-muted p-2 text-xs leading-5 text-ink-muted">
                  <span className="font-medium text-ink-strong">{signal.name || signal.email || "팀원"}</span>
                  {signal.editing ? `이 ${signal.editing}을 보고 있습니다.` : "이 접속했습니다."}
                </div>
              ))}
            </div>
          </section>
        ) : null}

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
                    <Users size={15} aria-hidden="true" />팀
                  </dt>
                  <dd className="font-medium text-ink-strong">{team.length}명</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-ink-muted">
                    <ShieldCheck size={15} aria-hidden="true" />내 권한
                  </dt>
                  <dd className="font-medium text-ink-strong">{getRoleLabel(currentRole)}</dd>
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

            <CommentsPanel
              comments={comments.slice(0, 4)}
              currentUser={currentUser}
              currentRole={currentRole}
              onAddComment={onAddComment}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
            />

            <section>
              <h3 className="mb-3 text-sm font-semibold text-ink-strong">최근 변경</h3>
              <ActivityList activities={activities.slice(0, 4)} compact />
            </section>
          </>
        ) : null}
      </div>
    </aside>
  );
}
