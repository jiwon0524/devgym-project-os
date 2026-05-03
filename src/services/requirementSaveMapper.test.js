import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRequirementArtifactRows,
  buildRequirementInsert,
  buildRequirementRpcArgs,
  buildTaskRowsFromAiResult,
} from "./requirementSaveMapper.js";

const analysis = {
  summary: "팀 프로젝트와 댓글 기능을 설계합니다.",
  functionalRequirements: ["사용자는 프로젝트를 만들 수 있다."],
  nonFunctionalRequirements: ["권한별 접근 제어가 필요하다."],
  uiRequirements: ["프로젝트 생성 화면이 필요하다."],
  apiDesign: [
    {
      method: "POST",
      path: "/api/projects",
      description: "프로젝트 생성",
      requestBody: { name: "string" },
      responseBody: { id: "uuid" },
    },
  ],
  databaseSchema: [{ tableName: "projects", columns: [{ name: "id", type: "uuid", constraint: "primary key" }] }],
  erdRelations: [{ from: "projects.owner_id", to: "users.id", type: "many-to-one" }],
  tasks: [{ title: "프로젝트 생성 API", description: "API 구현", priority: "high", status: "todo" }],
  risks: [{ content: "역할 정책이 복잡해질 수 있다.", severity: "medium" }],
  acceptanceCriteria: ["프로젝트 생성 후 목록에 표시된다."],
  testCases: [{ title: "프로젝트 생성", given: "사용자가 로그인했을 때", when: "프로젝트를 만들면", then: "새 프로젝트가 저장된다." }],
};

test("requirement save flow builds requirement insert row", () => {
  const result = buildRequirementInsert({
    projectId: "project-1",
    title: "팀 프로젝트",
    input: "팀 프로젝트 만들기",
    analysis,
    createdBy: "user-1",
  });

  assert.equal(result.row.project_id, "project-1");
  assert.equal(result.row.summary, analysis.summary);
  assert.equal(result.row.non_functional.length, 1);
});

test("requirement save flow builds criteria, risk, and test case rows", () => {
  const rows = buildRequirementArtifactRows({ requirementId: "requirement-1", analysis });

  assert.equal(rows.acceptanceCriteria[0].requirement_id, "requirement-1");
  assert.equal(rows.risks[0].severity, "medium");
  assert.equal(rows.testCases[0].given_text, "사용자가 로그인했을 때");
});

test("task creation from AI result builds task rows", () => {
  const rows = buildTaskRowsFromAiResult({
    projectId: "project-1",
    requirementId: "requirement-1",
    analysis,
    createdBy: "user-1",
  });

  assert.equal(rows[0].title, "프로젝트 생성 API");
  assert.equal(rows[0].priority, "high");
  assert.equal(rows[0].status, "todo");
});

test("requirement save flow builds transactional RPC args", () => {
  const args = buildRequirementRpcArgs({
    projectId: "project-1",
    title: "팀 프로젝트",
    input: "팀 프로젝트 만들기",
    analysis,
  });

  assert.equal(args.p_project_id, "project-1");
  assert.equal(args.p_title, "팀 프로젝트");
  assert.equal(args.p_tasks[0].title, "프로젝트 생성 API");
  assert.equal(args.p_acceptance_criteria[0], "프로젝트 생성 후 목록에 표시된다.");
  assert.equal(args.p_test_cases[0].then, "새 프로젝트가 저장된다.");
});
