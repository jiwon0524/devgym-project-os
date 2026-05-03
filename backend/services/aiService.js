import { parseAndValidateAiJson, requirementAnalysisSchema } from "../utils/jsonValidator.js";

export const SYSTEM_PROMPT = `You are an expert software architect and product manager.
Analyze the user requirement and return only valid JSON.
Do not include markdown.
Do not include explanations outside JSON.
Generate realistic software engineering artifacts.
All natural language content must be written in Korean.
API paths, HTTP methods, database table names, and column names may remain in English.`;

function buildUserPrompt({ projectId, input }) {
  return `Project ID: ${projectId || "unknown"}

User requirement:
${input}

Return JSON with exactly these top-level keys:
summary, functionalRequirements, nonFunctionalRequirements, uiRequirements, apiDesign, databaseSchema, erdRelations, tasks, risks, acceptanceCriteria, testCases.

Make the result practical for a React + Supabase SaaS project management tool.
Tasks must use priority low, medium, or high and status todo, in_progress, or done.
Risks must use severity low, medium, or high.`;
}

function extractResponseText(responseJson) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;

  const chunks = [];
  for (const item of responseJson.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") chunks.push(content.text);
      if (typeof content.output_text === "string") chunks.push(content.output_text);
    }
  }

  return chunks.join("\n").trim();
}

async function requestOpenAiJson({ input, previousInvalidOutput }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const body = {
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: SYSTEM_PROMPT }],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: previousInvalidOutput
              ? `${input}

The previous response was invalid JSON or did not match the schema.
Repair it and return only valid JSON matching the required schema.
Invalid response:
${previousInvalidOutput}`
              : input,
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "requirement_analysis",
        strict: true,
        schema: requirementAnalysisSchema,
      },
    },
    reasoning: { effort: "low" },
    max_output_tokens: 6000,
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseJson = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = responseJson.error?.message || `OpenAI API 요청 실패 (${response.status})`;
    throw new Error(message);
  }

  return extractResponseText(responseJson);
}

export async function analyzeRequirementWithAi({ projectId, input }) {
  if (!input?.trim()) {
    throw new Error("분석할 요구사항을 입력해야 합니다.");
  }

  const prompt = buildUserPrompt({ projectId, input });
  const firstOutput = await requestOpenAiJson({ input: prompt });

  try {
    return parseAndValidateAiJson(firstOutput);
  } catch (firstError) {
    const repairedOutput = await requestOpenAiJson({
      input: prompt,
      previousInvalidOutput: firstOutput,
    });

    try {
      return parseAndValidateAiJson(repairedOutput);
    } catch {
      throw new Error(`AI 응답 JSON을 검증하지 못했습니다. ${firstError.message}`);
    }
  }
}
