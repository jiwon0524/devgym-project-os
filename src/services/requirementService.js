import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { mapRequirementRecord, mapTask } from "./mappers.js";
import { makeMockId, readMockStore, updateMockStore } from "./mockStore.js";
import { buildRequirementInsert, buildRequirementRpcArgs } from "./requirementSaveMapper.js";

function getRequirementTitle(input) {
  return input
    .split(/\n|,|;|그리고|및/g)
    .map((item) => item.trim())
    .filter(Boolean)[0] || "신규 요구사항";
}

export async function getRequirements(projectId) {
  if (!projectId) return [];

  if (!isSupabaseConfigured) {
    return readMockStore().requirements
      .filter((requirement) => requirement.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const { data, error } = await supabase
    .from("requirements")
    .select("*, acceptance_criteria(content), risks(content,severity), test_cases(title,given_text,when_text,then_text)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapRequirementRecord);
}

export async function createRequirement({ projectId, input, analysis, createdBy }) {
  const title = getRequirementTitle(input);
  const { analysis: aiAnalysis } = buildRequirementInsert({ projectId, title, input, analysis, createdBy });

  if (!isSupabaseConfigured) {
    const now = new Date().toISOString();
    const requirement = {
      id: makeMockId("requirement"),
      projectId,
      title,
      originalInput: input,
      summary: aiAnalysis?.summary || analysis.meta?.summary || title,
      functionalRequirements: aiAnalysis?.functionalRequirements || analysis.functional || [],
      nonFunctionalRequirements: aiAnalysis?.nonFunctionalRequirements || [],
      uiRequirements: aiAnalysis?.uiRequirements || analysis.ui || [],
      apiDesign: aiAnalysis?.apiDesign || analysis.api || [],
      databaseSchema: aiAnalysis?.databaseSchema || analysis.database || [],
      erdRelations: aiAnalysis?.erdRelations || analysis.relationships || [],
      tasks: aiAnalysis?.tasks || analysis.tasks || [],
      risks: aiAnalysis?.risks || [],
      acceptanceCriteria: aiAnalysis?.acceptanceCriteria || [],
      testCases: aiAnalysis?.testCases || [],
      createdBy,
      createdAt: now,
      ...analysis,
    };
    const savedTasks = (aiAnalysis?.tasks || []).map((task) => ({
      id: makeMockId("task"),
      projectId,
      requirementId: requirement.id,
      title: task.title,
      description: task.description || "AI 요구사항 분석에서 생성된 작업입니다.",
      status: task.status === "in_progress" ? "In Progress" : task.status === "done" ? "Done" : "Todo",
      priority: task.priority === "high" ? "High" : task.priority === "low" ? "Low" : "Medium",
      assigneeId: createdBy,
      assignee: "지원",
      source: "AI 요구사항 분석",
      createdBy,
      createdAt: now,
    }));

    updateMockStore((store) => ({
      ...store,
      requirements: [requirement, ...store.requirements],
      tasks: [...store.tasks, ...savedTasks],
    }));

    return { ...requirement, savedTasks };
  }

  const { data, error } = await supabase.rpc(
    "create_requirement_analysis",
    buildRequirementRpcArgs({ projectId, title, input, analysis })
  );

  if (error) throw error;

  const requirementRow = data?.requirement;
  const savedTasks = (data?.tasks || []).map(mapTask);

  return {
    ...mapRequirementRecord(requirementRow),
    ...aiAnalysis,
    savedTasks,
  };
}

export async function analyzeAndCreateRequirement({ projectId, input, createdBy }) {
  throw new Error("AI 분석은 src/services/aiRequirementService.js의 백엔드 프록시를 통해 실행합니다.");
}
