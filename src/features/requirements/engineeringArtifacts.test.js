import test from "node:test";
import assert from "node:assert/strict";
import { buildEngineeringArtifacts } from "./engineeringArtifacts.js";

const analysis = {
  summary: "팀원이 프로젝트 요구사항에 댓글을 남길 수 있는 협업 기능",
  functionalRequirements: [
    "팀원은 프로젝트 요구사항에 댓글을 작성할 수 있다.",
    "관리자는 댓글을 삭제할 수 있다.",
  ],
  nonFunctionalRequirements: ["권한별 접근 제어가 필요하다."],
  uiRequirements: ["요구사항 상세 화면에 댓글 패널을 제공한다."],
  apiDesign: [
    {
      method: "POST",
      path: "/api/comments",
      description: "댓글 생성",
      requestBody: { body: "string" },
      responseBody: { id: "uuid" },
    },
  ],
  databaseSchema: [
    {
      tableName: "comments",
      columns: [
        { name: "id", type: "uuid", constraint: "primary key" },
        { name: "project_id", type: "uuid", constraint: "foreign key" },
      ],
    },
  ],
  erdRelations: [{ from: "comments.project_id", to: "projects.id", type: "many-to-one" }],
  tasks: [{ title: "댓글 API 구현", description: "댓글 생성 API를 구현한다.", priority: "medium", status: "todo" }],
  risks: [{ content: "댓글 삭제 권한이 과도할 수 있다.", severity: "medium" }],
  acceptanceCriteria: ["팀원이 댓글 작성 후 목록에서 확인할 수 있다."],
  testCases: [
    {
      title: "댓글 작성",
      given: "팀원이 로그인한 상태",
      when: "댓글을 작성하면",
      then: "댓글 목록에 표시된다.",
    },
  ],
};

test("engineering artifacts include PRD, UML, test plan, and traceability", () => {
  const artifacts = buildEngineeringArtifacts(analysis);

  assert.equal(artifacts.prd.title, analysis.summary);
  assert.match(artifacts.uml.sequence, /sequenceDiagram/);
  assert.match(artifacts.uml.useCase, /flowchart LR/);
  assert.equal(artifacts.testPlan.levels.length, 4);
  assert.equal(artifacts.traceability[0].id, "REQ-001");
  assert.equal(artifacts.traceability[0].api, "POST /api/comments");
  assert.match(artifacts.markdown, /## 추적 매트릭스/);
});
