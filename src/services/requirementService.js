import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";
import { mapRequirementRecord } from "./mappers.js";
import { makeMockId, readMockStore, updateMockStore } from "./mockStore.js";
import { buildRequirementArtifactRows, buildRequirementInsert } from "./requirementSaveMapper.js";

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
  const { row, analysis: aiAnalysis } = buildRequirementInsert({ projectId, title, input, analysis, createdBy });

  if (!isSupabaseConfigured) {
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
      createdAt: new Date().toISOString(),
      ...analysis,
    };

    updateMockStore((store) => ({
      ...store,
      requirements: [requirement, ...store.requirements],
    }));

    return requirement;
  }

  const { data, error } = await supabase
    .from("requirements")
    .insert(row)
    .select("*")
    .single();

  if (error) throw error;

  const artifactRows = buildRequirementArtifactRows({ requirementId: data.id, analysis: aiAnalysis });
  const insertions = [];
  if (artifactRows.acceptanceCriteria.length) insertions.push(supabase.from("acceptance_criteria").insert(artifactRows.acceptanceCriteria));
  if (artifactRows.risks.length) insertions.push(supabase.from("risks").insert(artifactRows.risks));
  if (artifactRows.testCases.length) insertions.push(supabase.from("test_cases").insert(artifactRows.testCases));

  const insertionResults = await Promise.all(insertions);
  const insertionError = insertionResults.find((result) => result.error)?.error;
  if (insertionError) throw insertionError;

  return {
    ...mapRequirementRecord(data),
    ...aiAnalysis,
  };
}

export async function analyzeAndCreateRequirement({ projectId, input, createdBy }) {
  throw new Error("AI 분석은 src/services/aiRequirementService.js의 백엔드 프록시를 통해 실행합니다.");
}
