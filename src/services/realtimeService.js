import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

export function subscribeToProjectRealtime({ projectId, workspaceId, onChange, onStatusChange }) {
  if (!isSupabaseConfigured || !projectId || !workspaceId) {
    onStatusChange?.("mock");
    return () => {};
  }

  const channel = supabase
    .channel(`projectos:${workspaceId}:${projectId}`)
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
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
