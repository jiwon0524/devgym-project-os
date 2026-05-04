import {
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Users,
} from "lucide-react";
import { AuthPanel } from "../features/auth/AuthPanel.jsx";

const items = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "projects", label: "프로젝트", icon: FolderKanban },
  { id: "my-tasks", label: "내 작업", icon: CheckSquare },
  { id: "requirements", label: "요구사항", icon: ListChecks },
  { id: "team", label: "팀", icon: Users },
];

export function Sidebar({
  activeNav,
  onNavigate,
  project,
  backendMode,
  authUser,
  authLoading,
  authError,
  onLogin,
  onSignUp,
  onLogout,
}) {
  return (
    <aside className="sticky top-0 z-30 flex w-full shrink-0 flex-col border-b border-surface-line bg-white md:static md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex h-16 items-center gap-3 border-b border-surface-line px-4 md:px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-strong text-sm font-semibold text-white">
          DG
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-strong">DevGym</p>
          <p className="text-xs text-ink-muted">ProjectOS</p>
        </div>
      </div>

      <nav className="nav-scrollbar flex gap-1 overflow-x-auto p-2 md:block md:space-y-1 md:p-3" aria-label="주요 메뉴">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;

          return (
            <button
              key={item.id}
              type="button"
              data-testid={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`flex h-10 w-auto shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium transition duration-150 md:w-full md:gap-3 md:px-3 md:text-sm ${
                active
                  ? "bg-surface-muted text-ink-strong"
                  : "text-ink-muted hover:bg-surface-muted hover:text-ink-strong"
              }`}
            >
              <Icon size={17} className="hidden md:block" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {backendMode === "supabase" ? (
        <div className="border-t border-surface-line p-3 md:hidden">
          <AuthPanel
            mode={backendMode}
            user={authUser}
            loading={authLoading}
            error={authError}
            onLogin={onLogin}
            onSignUp={onSignUp}
            onLogout={onLogout}
          />
        </div>
      ) : null}

      <div className="mt-auto hidden space-y-4 border-t border-surface-line p-4 md:block">
        <AuthPanel
          mode={backendMode}
          user={authUser}
          loading={authLoading}
          error={authError}
          onLogin={onLogin}
          onSignUp={onSignUp}
          onLogout={onLogout}
        />
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
