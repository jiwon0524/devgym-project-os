import { ActivityList } from "../../features/activity/ActivityList.jsx";
import { OnlineMembers } from "../../features/team/OnlineMembers.jsx";

export function ActivityTab({ activities, team }) {
  return (
    <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink-strong">프로젝트 활동 기록</h2>
          <p className="mt-1 text-sm text-ink-muted">
            요구사항, 작업, 댓글, 팀 변경 사항을 시간순으로 확인합니다.
          </p>
        </div>
        <ActivityList activities={activities} />
      </section>

      <aside className="space-y-4 rounded-lg border border-surface-line bg-white p-5">
        <h2 className="text-lg font-semibold text-ink-strong">실시간 협업 상태</h2>
        <OnlineMembers members={team} />
        <div className="rounded-lg border border-surface-line bg-surface-muted p-4">
          <p className="text-sm font-semibold text-ink-strong">연동 준비 구조</p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            현재는 mock presence를 표시합니다. 이후 Supabase Realtime 또는 WebSocket 이벤트를
            `activities`와 `members.online` 상태에 연결하면 됩니다.
          </p>
        </div>
      </aside>
    </div>
  );
}
