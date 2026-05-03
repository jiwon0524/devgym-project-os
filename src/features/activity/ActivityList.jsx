import { Clock3 } from "lucide-react";

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function ActivityList({ activities, compact = false }) {
  if (!activities.length) {
    return (
      <div className="rounded-lg border border-dashed border-surface-line bg-white p-6 text-center">
        <p className="text-sm font-medium text-ink-strong">아직 활동 기록이 없습니다</p>
        <p className="mt-1 text-sm text-ink-muted">요구사항, 작업, 팀 변경이 이곳에 쌓입니다.</p>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`rounded-lg border border-surface-line bg-white ${compact ? "p-3" : "p-4"}`}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
              <Clock3 size={15} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-base">
                <span className="font-semibold text-ink-strong">{activity.actor}</span>님이{" "}
                {activity.action}
              </p>
              <p className="mt-1 truncate text-sm text-ink-muted">{activity.target}</p>
              <p className="mt-2 text-xs text-ink-faint">{formatTime(activity.timestamp)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
