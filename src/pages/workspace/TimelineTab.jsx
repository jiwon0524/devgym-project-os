import { CheckCircle2, Circle, CircleDot } from "lucide-react";

const milestones = [
  { title: "범위 정의", date: "1주차", state: "done" },
  { title: "개발", date: "2주차", state: "active" },
  { title: "배포", date: "3주차", state: "next" },
];

const iconMap = {
  done: CheckCircle2,
  active: CircleDot,
  next: Circle,
};

export function TimelineTab() {
  return (
    <div className="p-6">
      <section className="rounded-lg border border-surface-line bg-white p-5">
        <h2 className="text-lg font-semibold text-ink-strong">일정</h2>
        <p className="mt-1 text-sm text-ink-muted">범위 정의부터 배포까지의 단순한 진행 경로입니다.</p>

        <div className="mt-6 space-y-4">
          {milestones.map((milestone) => {
            const Icon = iconMap[milestone.state];
            return (
              <div key={milestone.title} className="flex items-center gap-4 rounded-lg border border-surface-line p-4">
                <Icon
                  size={18}
                  className={milestone.state === "active" ? "text-brand" : "text-ink-muted"}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-strong">{milestone.title}</p>
                  <p className="text-sm text-ink-muted">{milestone.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
