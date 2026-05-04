import assert from "node:assert/strict";
import test from "node:test";
import { buildEngineeringDocumentPayload } from "./artifactService.js";

const analysis = {
  summary: "팀 프로젝트 협업 기능",
  functionalRequirements: ["팀 프로젝트를 생성할 수 있다", "팀원이 댓글을 작성할 수 있다"],
  nonFunctionalRequirements: ["권한 검증이 필요하다"],
  uiRequirements: ["프로젝트 생성 화면", "댓글 패널"],
  apiDesign: [
    {
      method: "POST",
      path: "/api/projects",
      description: "프로젝트 생성",
      requestBody: {},
      responseBody: {},
    },
  ],
  databaseSchema: [
    {
      tableName: "projects",
      columns: [{ name: "id", type: "uuid", constraint: "primary key" }],
    },
  ],
  erdRelations: [],
  tasks: [{ title: "프로젝트 생성 API", description: "API 구현", priority: "medium", status: "todo" }],
  risks: [{ content: "권한 누락 위험", severity: "high" }],
  acceptanceCriteria: ["권한 있는 사용자만 프로젝트를 생성한다"],
  testCases: [{ title: "프로젝트 생성", given: "로그인", when: "생성", then: "저장" }],
};

test("engineering artifact payload creates versionable documents", () => {
  const payload = buildEngineeringDocumentPayload({
    workspaceId: "workspace-id",
    projectId: "project-id",
    requirementId: "requirement-id",
    analysis,
  });

  assert.equal(payload.length, 4);
  assert.deepEqual(
    payload.map((item) => item.type),
    ["prd", "uml", "test_plan", "traceability"],
  );
  assert.equal(payload[0].workspaceId, "workspace-id");
  assert.equal(payload[0].projectId, "project-id");
  assert.equal(payload[0].requirementId, "requirement-id");
  assert.ok(payload[0].markdown.includes("# 팀 프로젝트 협업 기능"));
});
