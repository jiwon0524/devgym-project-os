import { Sidebar } from "./Sidebar.jsx";
import { RightPanel } from "./RightPanel.jsx";

export function AppLayout({
  activeNav,
  onNavigate,
  project,
  tasks,
  team,
  children,
}) {
  return (
    <div className="flex min-h-screen bg-surface-canvas text-ink-base">
      <Sidebar activeNav={activeNav} onNavigate={onNavigate} project={project} />
      <main className="app-scrollbar h-screen min-w-0 flex-1 overflow-y-auto">{children}</main>
      <RightPanel project={project} tasks={tasks} team={team} activeView={activeNav} />
    </div>
  );
}
