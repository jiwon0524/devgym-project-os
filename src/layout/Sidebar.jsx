import {
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Users,
} from "lucide-react";

const items = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "projects", label: "프로젝트", icon: FolderKanban },
  { id: "my-tasks", label: "내 작업", icon: CheckSquare },
  { id: "requirements", label: "요구사항", icon: ListChecks },
  { id: "team", label: "팀", icon: Users },
];

export function Sidebar({ activeNav, onNavigate, project }) {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-surface-line bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-surface-line px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-strong text-sm font-semibold text-white">
          DG
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-strong">DevGym</p>
          <p className="text-xs text-ink-muted">ProjectOS</p>
        </div>
      </div>

      <nav className="space-y-1 p-3" aria-label="주요 메뉴">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-150 ${
                active
                  ? "bg-surface-muted text-ink-strong"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink-strong"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-surface-line p-4">
        <p className="text-xs font-medium uppercase text-ink-faint">현재 프로젝트</p>
        <p className="mt-2 truncate text-sm font-medium text-ink-strong">
          {project?.name || "아직 프로젝트가 없습니다"}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {project ? "워크스페이스 준비 완료" : "프로젝트 생성부터 시작하세요"}
        </p>
      </div>
    </aside>
  );
}
