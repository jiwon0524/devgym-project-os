import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

function mapPresenceState(state) {
  return Object.values(state || {})
    .flat()
    .map((presence, index) => ({
      id: presence.userId || presence.email || `presence-${index}`,
      userId: presence.userId,
      name: presence.name || presence.email || "팀원",
      email: presence.email || "",
      role: presence.role || "Member",
      status: "Active",
      online: true,
      editing: presence.editing || "",
      avatarColor: presence.avatarColor || "bg-slate-700",
      lastSeenAt: presence.at,
    }));
}

function getEditingLabel(activeView) {
  const labels = {
    Overview: "프로젝트 개요",
    Requirements: "요구사항 분석",
    Tasks: "작업 보드",
    Timeline: "일정",
    Team: "팀 설정",
    Activity: "활동 기록",
    dashboard: "대시보드",
    projects: "프로젝트 목록",
    requirements: "요구사항 분석",
    "my-tasks": "내 작업",
    team: "팀 설정",
  };

  return labels[activeView] || "프로젝트";
}

export function subscribeToProjectRealtime({
  projectId,
  workspaceId,
  currentUser,
  activeView,
  onChange,
  onStatusChange,
  onPresenceChange,
}) {
  if (!isSupabaseConfigured || !projectId || !workspaceId) {
    onStatusChange?.("mock");
    onPresenceChange?.([]);
    return () => {};
  }

  const channel = supabase
    .channel(`projectos:${workspaceId}:${projectId}`)
    .on("presence", { event: "sync" }, () => {
      onPresenceChange?.(mapPresenceState(channel.presenceState()));
    })
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "requirements", filter: `project_id=eq.${projectId}` },
      (payload) => onChange?.("requirements", payload)
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
      (payload) => onChange?.("tasks", payload)
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "comments", filter: `project_id=eq.${projectId}` },
      (payload) => onChange?.("comments", payload)
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "activity_logs", filter: `workspace_id=eq.${workspaceId}` },
      (payload) => onChange?.("activity_logs", payload)
    )
    .subscribe((status) => {
      onStatusChange?.(status);
      if (status === "SUBSCRIBED" && currentUser) {
        channel.track({
          userId: currentUser.userId || currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          editing: getEditingLabel(activeView),
          avatarColor: currentUser.avatarColor,
          at: new Date().toISOString(),
        });
      }
    });

  return () => {
    onPresenceChange?.([]);
    supabase.removeChannel(channel);
  };
}
