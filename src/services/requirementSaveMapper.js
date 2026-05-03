import { normalizeAiRequirementResult } from "../features/requirements/aiRequirementUtils.js";

export function buildRequirementInsert({ projectId, title, input, analysis, createdBy }) {
  const normalized = normalizeAiRequirementResult(analysis);

  return {
    row: {
      project_id: projectId,
      title,
      original_input: input,
      summary: normalized?.summary || analysis?.meta?.summary || title,
      functional: normalized?.functionalRequirements || analysis?.functional || [],
      non_functional: normalized?.nonFunctionalRequirements || [],
      ui: normalized?.uiRequirements || analysis?.ui || [],
      api: normalized?.apiDesign || analysis?.api || [],
      database_schema: normalized?.databaseSchema || analysis?.database || [],
      erd_relations: normalized?.erdRelations || analysis?.relationships || [],
      created_by: createdBy,
    },
    analysis: normalized,
  };
}

export function buildRequirementRpcArgs({ projectId, title, input, analysis }) {
  const normalized = normalizeAiRequirementResult(analysis);

  return {
    p_project_id: projectId,
    p_title: title,
    p_original_input: input,
    p_summary: normalized?.summary || analysis?.meta?.summary || title,
    p_functional: normalized?.functionalRequirements || analysis?.functional || [],
    p_non_functional: normalized?.nonFunctionalRequirements || [],
    p_ui: normalized?.uiRequirements || analysis?.ui || [],
    p_api: normalized?.apiDesign || analysis?.api || [],
    p_database_schema: normalized?.databaseSchema || analysis?.database || [],
    p_erd_relations: normalized?.erdRelations || analysis?.relationships || [],
    p_tasks: normalized?.tasks || [],
    p_acceptance_criteria: normalized?.acceptanceCriteria || [],
    p_risks: normalized?.risks || [],
    p_test_cases: normalized?.testCases || [],
  };
}

export function buildRequirementArtifactRows({ requirementId, analysis }) {
  const normalized = normalizeAiRequirementResult(analysis);

  return {
    acceptanceCriteria: (normalized?.acceptanceCriteria || []).map((content) => ({
      requirement_id: requirementId,
      content,
    })),
    risks: (normalized?.risks || []).map((risk) => ({
      requirement_id: requirementId,
      content: risk.content,
      severity: risk.severity || "medium",
    })),
    testCases: (normalized?.testCases || []).map((testCase) => ({
      requirement_id: requirementId,
      title: testCase.title,
      given_text: testCase.given,
      when_text: testCase.when,
      then_text: testCase.then,
    })),
  };
}

export function buildTaskRowsFromAiResult({ projectId, requirementId, analysis, createdBy }) {
  const normalized = normalizeAiRequirementResult(analysis);

  return (normalized?.tasks || []).map((task) => ({
    project_id: projectId,
    requirement_id: requirementId,
    title: task.title,
    description: task.description || "AI 요구사항 분석에서 생성된 작업입니다.",
    status: task.status || "todo",
    priority: task.priority || "medium",
    assignee_id: createdBy || null,
    created_by: createdBy,
  }));
}
