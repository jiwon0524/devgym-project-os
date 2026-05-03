export const requirementAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "functionalRequirements",
    "nonFunctionalRequirements",
    "uiRequirements",
    "apiDesign",
    "databaseSchema",
    "erdRelations",
    "tasks",
    "risks",
    "acceptanceCriteria",
    "testCases",
  ],
  properties: {
    summary: { type: "string" },
    functionalRequirements: { type: "array", items: { type: "string" } },
    nonFunctionalRequirements: { type: "array", items: { type: "string" } },
    uiRequirements: { type: "array", items: { type: "string" } },
    apiDesign: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["method", "path", "description", "requestBody", "responseBody"],
        properties: {
          method: { type: "string" },
          path: { type: "string" },
          description: { type: "string" },
          requestBody: { type: "object", additionalProperties: true },
          responseBody: { type: "object", additionalProperties: true },
        },
      },
    },
    databaseSchema: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tableName", "columns"],
        properties: {
          tableName: { type: "string" },
          columns: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "type", "constraint"],
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                constraint: { type: "string" },
              },
            },
          },
        },
      },
    },
    erdRelations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["from", "to", "type"],
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          type: { type: "string" },
        },
      },
    },
    tasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "priority", "status"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
        },
      },
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["content", "severity"],
        properties: {
          content: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    acceptanceCriteria: { type: "array", items: { type: "string" } },
    testCases: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "given", "when", "then"],
        properties: {
          title: { type: "string" },
          given: { type: "string" },
          when: { type: "string" },
          then: { type: "string" },
        },
      },
    },
  },
};

const allowedPriority = new Set(["low", "medium", "high"]);
const allowedTaskStatus = new Set(["todo", "in_progress", "done"]);

export function extractJsonObject(text) {
  if (typeof text !== "string") {
    throw new Error("AI 응답이 문자열이 아닙니다.");
  }

  const stripped = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 응답에서 JSON 객체를 찾지 못했습니다.");
  }

  return stripped.slice(start, end + 1);
}

export function parseJsonObject(text) {
  return JSON.parse(extractJsonObject(text));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeStringArray(value) {
  return asArray(value).map((item) => asString(item)).filter(Boolean);
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizePriority(value) {
  const normalized = asString(value, "medium").toLowerCase().replace(/\s+/g, "_");
  return allowedPriority.has(normalized) ? normalized : "medium";
}

function normalizeTaskStatus(value) {
  const normalized = asString(value, "todo").toLowerCase().replace(/\s+/g, "_");
  return allowedTaskStatus.has(normalized) ? normalized : "todo";
}

export function normalizeAiRequirementResult(value) {
  const result = normalizeObject(value);

  return {
    summary: asString(result.summary, "요구사항 분석 결과입니다."),
    functionalRequirements: normalizeStringArray(result.functionalRequirements),
    nonFunctionalRequirements: normalizeStringArray(result.nonFunctionalRequirements),
    uiRequirements: normalizeStringArray(result.uiRequirements),
    apiDesign: asArray(result.apiDesign).map((api) => ({
      method: asString(api?.method, "GET").toUpperCase(),
      path: asString(api?.path, "/api/resource"),
      description: asString(api?.description, "API 설명이 필요합니다."),
      requestBody: normalizeObject(api?.requestBody),
      responseBody: normalizeObject(api?.responseBody),
    })),
    databaseSchema: asArray(result.databaseSchema).map((table) => ({
      tableName: asString(table?.tableName, "records"),
      columns: asArray(table?.columns).map((column) => ({
        name: asString(column?.name, "id"),
        type: asString(column?.type, "uuid"),
        constraint: asString(column?.constraint, ""),
      })),
    })),
    erdRelations: asArray(result.erdRelations).map((relation) => ({
      from: asString(relation?.from),
      to: asString(relation?.to),
      type: asString(relation?.type, "many-to-one"),
    })).filter((relation) => relation.from && relation.to),
    tasks: asArray(result.tasks).map((task) => ({
      title: asString(task?.title, "새 작업"),
      description: asString(task?.description, "AI 분석에서 생성된 작업입니다."),
      priority: normalizePriority(task?.priority),
      status: normalizeTaskStatus(task?.status),
    })),
    risks: asArray(result.risks).map((risk) => {
      if (typeof risk === "string") return { content: risk, severity: "medium" };
      return {
        content: asString(risk?.content, "리스크 설명이 필요합니다."),
        severity: normalizePriority(risk?.severity),
      };
    }),
    acceptanceCriteria: normalizeStringArray(result.acceptanceCriteria),
    testCases: asArray(result.testCases).map((testCase) => ({
      title: asString(testCase?.title, "테스트 케이스"),
      given: asString(testCase?.given, "사전 조건"),
      when: asString(testCase?.when, "사용자가 행동하면"),
      then: asString(testCase?.then, "기대 결과를 확인한다."),
    })),
  };
}

export function validateAiRequirementResult(value) {
  const data = normalizeAiRequirementResult(value);
  const errors = [];

  if (!data.summary) errors.push("summary가 비어 있습니다.");
  if (!data.functionalRequirements.length) errors.push("functionalRequirements가 비어 있습니다.");
  if (!data.tasks.length) errors.push("tasks가 비어 있습니다.");
  if (!data.acceptanceCriteria.length) errors.push("acceptanceCriteria가 비어 있습니다.");
  if (!data.testCases.length) errors.push("testCases가 비어 있습니다.");

  data.apiDesign.forEach((api, index) => {
    if (!api.path.startsWith("/")) errors.push(`apiDesign[${index}].path는 /로 시작해야 합니다.`);
  });

  data.databaseSchema.forEach((table, tableIndex) => {
    if (!table.columns.length) errors.push(`databaseSchema[${tableIndex}]에 columns가 없습니다.`);
  });

  return {
    valid: errors.length === 0,
    data,
    errors,
  };
}

export function parseAndValidateAiJson(text) {
  const parsed = parseJsonObject(text);
  const validation = validateAiRequirementResult(parsed);

  if (!validation.valid) {
    throw new Error(`AI JSON 검증 실패: ${validation.errors.join(" ")}`);
  }

  return validation.data;
}
