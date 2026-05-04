import { Sidebar } from "./Sidebar.jsx";
import { RightPanel } from "./RightPanel.jsx";
import { BackendBanner } from "../components/BackendBanner.jsx";

export function AppLayout({
  activeNav,
  onNavigate,
  project,
  tasks,
  team,
  activeWorkspace,
  currentUser,
  currentRole,
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  activities,
  backendMode,
  backendLoading,
  backendError,
  realtimeStatus,
  collaborationSignals,
  authRequired,
  authUser,
  authLoading,
  authError,
  onLogin,
  onSignUp,
  onLogout,
  children,
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas text-ink-base md:flex-row">
      <Sidebar
        activeNav={activeNav}
        onNavigate={onNavigate}
        project={project}
        backendMode={backendMode}
        authUser={authUser}
        authLoading={authLoading}
        authError={authError}
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
      />
      <main className="app-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto md:h-screen">
        <BackendBanner
          mode={backendMode}
          loading={backendLoading}
          error={backendError}
          realtimeStatus={realtimeStatus}
          authRequired={authRequired}
        />
        {children}
      </main>
      <RightPanel
        project={project}
        tasks={tasks}
        team={team}
        activeWorkspace={activeWorkspace}
        currentUser={currentUser}
        currentRole={currentRole}
        comments={comments}
        onAddComment={onAddComment}
        onEditComment={onEditComment}
        onDeleteComment={onDeleteComment}
        activities={activities}
        activeView={activeNav}
        backendMode={backendMode}
        realtimeStatus={realtimeStatus}
        collaborationSignals={collaborationSignals}
      />
    </div>
  );
}
