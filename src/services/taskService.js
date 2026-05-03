import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { mapTask, toDbPriority, toDbTaskStatus } from "./mappers.js";
import { makeMockId, readMockStore, updateMockStore } from "./mockStore.js";

const statusFromAi = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const priorityFromAi = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export async function getTasks(projectId) {
  if (!projectId) return [];

  if (!isSupabaseConfigured) {
    return readMockStore().tasks.filter((task) => !task.projectId || task.projectId === projectId);
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assignee_id_fkey(id,email,display_name,avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data.map(mapTask);
}

export async function createTask({ projectId, requirementId, title, description = "", status = "Todo", priority = "Medium", assigneeId, createdBy }) {
  if (!isSupabaseConfigured) {
    const task = {
      id: makeMockId("task"),
      projectId,
      requirementId,
      title,
      description,
      status,
      priority,
      assigneeId,
      assignee: "미배정",
      createdBy,
      createdAt: new Date().toISOString(),
    };

    updateMockStore((store) => ({
      ...store,
      tasks: [...store.tasks, task],
    }));

    return task;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      requirement_id: requirementId || null,
      title,
      description,
      status: toDbTaskStatus(status),
      priority: toDbPriority(priority),
      assignee_id: assigneeId || null,
      created_by: createdBy,
    })
    .select("*, assignee:profiles!tasks_assignee_id_fkey(id,email,display_name,avatar_url)")
    .single();

  if (error) throw error;
  return mapTask(data);
}

export async function updateTask({ taskId, field, value }) {
  if (!isSupabaseConfigured) {
    updateMockStore((store) => ({
      ...store,
      tasks: store.tasks.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)),
    }));
    return;
  }

  const fieldMap = {
    status: "status",
    priority: "priority",
    title: "title",
    description: "description",
    assigneeId: "assignee_id",
  };
  const dbField = fieldMap[field] || field;
  const dbValue = field === "status" ? toDbTaskStatus(value) : field === "priority" ? toDbPriority(value) : value;

  const { error } = await supabase.from("tasks").update({ [dbField]: dbValue }).eq("id", taskId);
  if (error) throw error;
}

export async function createTasksFromRequirement({ projectId, requirementId, tasks, createdBy }) {
  const uniqueTasks = tasks || [];
  if (!uniqueTasks.length) return [];

  if (!isSupabaseConfigured) {
    const now = new Date().toISOString();
    const createdTasks = uniqueTasks.map((task) => ({
      id: makeMockId("task"),
      projectId,
      requirementId,
      title: task.title,
      description: task.description || "AI 요구사항 분석에서 생성된 작업입니다.",
      status: statusFromAi[task.status] || task.status || "Todo",
      priority: priorityFromAi[task.priority] || task.priority || "Medium",
      assigneeId: createdBy,
      assignee: "지원",
      source: "AI 요구사항 분석",
      createdBy,
      createdAt: now,
    }));

    updateMockStore((store) => ({
      ...store,
      tasks: [...store.tasks, ...createdTasks],
    }));

    return createdTasks;
  }

  const payload = uniqueTasks.map((task) => ({
    project_id: projectId,
    requirement_id: requirementId || null,
    title: task.title,
    description: task.description || "AI 요구사항 분석에서 생성된 작업입니다.",
    status: toDbTaskStatus(task.status || "Todo"),
    priority: toDbPriority(task.priority || "Medium"),
    assignee_id: createdBy || null,
    created_by: createdBy,
  }));

  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select("*, assignee:profiles!tasks_assignee_id_fkey(id,email,display_name,avatar_url)");

  if (error) throw error;
  return data.map(mapTask);
}
