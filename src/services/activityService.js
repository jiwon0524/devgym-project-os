import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { createActivity } from "../features/workspace/workspaceData.js";
import { mapActivity } from "./mappers.js";
import { readMockStore, updateMockStore } from "./mockStore.js";

export async function getActivityLogs({ workspaceId, projectId }) {
  if (!workspaceId) return [];

  if (!isSupabaseConfigured) {
    return readMockStore().activityLogs;
  }

  let query = supabase
    .from("activity_logs")
    .select("*, profiles:profiles(id,email,display_name,avatar_url)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (projectId) query = query.or(`project_id.eq.${projectId},project_id.is.null`);

  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapActivity);
}

export async function createActivityLog({ workspaceId, projectId, actorId, actorName = "시스템", action, targetType = "project", targetId, targetLabel }) {
  if (!isSupabaseConfigured) {
    const activity = createActivity(actorName, action, targetLabel || targetType);
    updateMockStore((store) => ({
      ...store,
      activityLogs: [activity, ...store.activityLogs].slice(0, 80),
    }));
    return activity;
  }

  const { data, error } = await supabase
    .from("activity_logs")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId || null,
      actor_id: actorId || null,
      action,
      target_type: targetType,
      target_id: targetId || null,
    })
    .select("*, profiles:profiles(id,email,display_name,avatar_url)")
    .single();

  if (error) throw error;
  return mapActivity(data);
}
