import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { assertUuid, isUuid } from "./idGuards.js";
import { mapProject, toDbProjectStatus } from "./mappers.js";
import { makeMockId, readMockStore, updateMockStore } from "./mockStore.js";

export async function getProjects(workspaceId) {
  if (!isSupabaseConfigured) {
    return readMockStore().projects.filter((project) => project.workspaceId === workspaceId);
  }
  if (!isUuid(workspaceId)) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapProject);
}

export async function createProject({ workspaceId, name, description, status = "active", createdBy }) {
  if (!isSupabaseConfigured) {
    const project = {
      id: makeMockId("project"),
      workspaceId,
      name,
      description,
      status,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    updateMockStore((store) => ({
      ...store,
      projects: [project, ...store.projects],
    }));

    return project;
  }

  assertUuid(workspaceId, "워크스페이스 ID");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: workspaceId,
      name,
      description,
      status: toDbProjectStatus(status),
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapProject(data);
}
