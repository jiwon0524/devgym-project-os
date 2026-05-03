import test from "node:test";
import assert from "node:assert/strict";
import { analyzeRequirementWithAi } from "../services/aiService.js";

test("AI service returns friendly error when OPENAI_API_KEY is missing", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  await assert.rejects(
    () => analyzeRequirementWithAi({ projectId: "project-1", input: "로그인 기능 만들기" }),
    /OPENAI_API_KEY/
  );

  if (previousKey) process.env.OPENAI_API_KEY = previousKey;
});
