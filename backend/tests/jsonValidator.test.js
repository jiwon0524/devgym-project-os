import test from "node:test";
import assert from "node:assert/strict";
import { parseAndValidateAiJson, parseJsonObject, validateAiRequirementResult } from "../utils/jsonValidator.js";

const validResult = {
  summary: "네이버 로그인과 팀 댓글 기능을 포함한 협업 요구사항입니다.",
  functionalRequirements: ["사용자는 네이버 계정으로 회원가입할 수 있다."],
  nonFunctionalRequirements: ["OAuth 토큰은 서버에서 안전하게 처리해야 한다."],
  uiRequirements: ["네이버 로그인 버튼이 필요하다."],
  apiDesign: [
    {
      method: "POST",
      path: "/api/auth/naver",
      description: "네이버 OAuth 콜백을 처리한다.",
      requestBody: { code: "string" },
      responseBody: { userId: "uuid" },
    },
  ],
  databaseSchema: [
    {
      tableName: "users",
      columns: [{ name: "id", type: "uuid", constraint: "primary key" }],
    },
  ],
  erdRelations: [{ from: "projects.user_id", to: "users.id", type: "many-to-one" }],
  tasks: [{ title: "네이버 OAuth 연결", description: "OAuth 플로우 구현", priority: "high", status: "todo" }],
  risks: [{ content: "OAuth 콜백 보안 검증이 필요하다.", severity: "medium" }],
  acceptanceCriteria: ["네이버 로그인 성공 시 사용자가 생성된다."],
  testCases: [{ title: "네이버 로그인", given: "인가 코드가 있을 때", when: "로그인하면", then: "세션이 생성된다." }],
};

test("AI response validation accepts required schema", () => {
  const result = validateAiRequirementResult(validResult);

  assert.equal(result.valid, true);
  assert.equal(result.data.tasks[0].priority, "high");
});

test("JSON parsing extracts fenced JSON", () => {
  const parsed = parseJsonObject(`\`\`\`json\n${JSON.stringify(validResult)}\n\`\`\``);

  assert.equal(parsed.summary, validResult.summary);
});

test("parseAndValidateAiJson rejects incomplete JSON", () => {
  assert.throws(() => parseAndValidateAiJson('{"summary":"부족함"}'), /검증 실패/);
});
