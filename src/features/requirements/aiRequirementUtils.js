export const emptyAiRequirementResult = {
  summary: "",
  functionalRequirements: [],
  nonFunctionalRequirements: [],
  uiRequirements: [],
  apiDesign: [],
  databaseSchema: [],
  erdRelations: [],
  tasks: [],
  risks: [],
  acceptanceCriteria: [],
  testCases: [],
};

const priorityLabels = {
  high: "High",
  medium: "Medium",
  low: "Low",
  High: "High",
  Medium: "Medium",
  Low: "Low",
};

const statusLabels = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
  Todo: "Todo",
  "In Progress": "In Progress",
  Done: "Done",
};

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

export function isAiRequirementResult(value) {
  return Boolean(value && typeof value === "object" && "functionalRequirements" in value);
}

export function normalizeAiRequirementResult(value) {
  if (!value || typeof value !== "object") return null;

  if (!isAiRequirementResult(value)) {
    return legacyAnalysisToAiResult(value);
  }

  return {
    summary: asString(value.summary, value.meta?.summary || "요구사항 분석 결과입니다."),
    functionalRequirements: normalizeStringArray(value.functionalRequirements),
    nonFunctionalRequirements: normalizeStringArray(value.nonFunctionalRequirements),
    uiRequirements: normalizeStringArray(value.uiRequirements),
    apiDesign: asArray(value.apiDesign).map((api) => ({
      method: asString(api?.method, "GET").toUpperCase(),
      path: asString(api?.path, "/api/resource"),
      description: asString(api?.description, "API 설명이 필요합니다."),
      requestBody: normalizeObject(api?.requestBody),
      responseBody: normalizeObject(api?.responseBody),
    })),
    databaseSchema: asArray(value.databaseSchema).map((table) => ({
      tableName: asString(table?.tableName, table?.name || "records"),
      columns: asArray(table?.columns).map((column) => ({
        name: asString(column?.name, "id"),
        type: asString(column?.type, "uuid"),
        constraint: asString(column?.constraint || column?.key || ""),
      })),
    })),
    erdRelations: asArray(value.erdRelations).map((relation) => ({
      from: asString(relation?.from),
      to: asString(relation?.to),
      type: asString(relation?.type, "many-to-one"),
    })).filter((relation) => relation.from && relation.to),
    tasks: asArray(value.tasks).map((task) => ({
      title: asString(task?.title, "새 작업"),
      description: asString(task?.description, "AI 분석에서 생성된 작업입니다."),
      priority: asString(task?.priority, "medium").toLowerCase(),
      status: asString(task?.status, "todo").toLowerCase(),
    })),
    risks: asArray(value.risks).map((risk) => {
      if (typeof risk === "string") return { content: risk, severity: "medium" };
      return {
        content: asString(risk?.content, "리스크 설명이 필요합니다."),
        severity: asString(risk?.severity, "medium").toLowerCase(),
      };
    }),
    acceptanceCriteria: normalizeStringArray(value.acceptanceCriteria),
    testCases: asArray(value.testCases).map((testCase) => ({
      title: asString(testCase?.title, "테스트 케이스"),
      given: asString(testCase?.given, "사전 조건"),
      when: asString(testCase?.when, "사용자가 행동하면"),
      then: asString(testCase?.then, "기대 결과를 확인한다."),
    })),
    meta: value.meta || {},
    id: value.id,
  };
}

export function legacyAnalysisToAiResult(analysis) {
  if (!analysis || typeof analysis !== "object") return null;

  return {
    ...emptyAiRequirementResult,
    id: analysis.id,
    summary: analysis.meta?.summary || "기존 요구사항 분석 결과입니다.",
    functionalRequirements: normalizeStringArray(analysis.functional),
    nonFunctionalRequirements: [
      "인증, 권한, 데이터 접근은 서버 정책으로 보호되어야 합니다.",
      "주요 화면은 로딩, 오류, 빈 상태를 제공해야 합니다.",
    ],
    uiRequirements: normalizeStringArray(analysis.ui),
    apiDesign: asArray(analysis.api).map((api) => ({
      method: asString(api?.method, "GET"),
      path: asString(api?.path, "/api/resource"),
      description: asString(api?.description, ""),
      requestBody: {},
      responseBody: {},
    })),
    databaseSchema: asArray(analysis.database).map((table) => ({
      tableName: table.name,
      columns: asArray(table.columns).map((column) => ({
        name: column.name,
        type: column.type,
        constraint: column.key || "",
      })),
    })),
    erdRelations: asArray(analysis.relationships).map((relation) => ({
      from: relation.from,
      to: relation.to,
      type: relation.type || "many-to-one",
    })),
    tasks: asArray(analysis.tasks).map((task) => ({
      title: task.title,
      description: "요구사항 분석에서 생성된 작업입니다.",
      priority: asString(task.priority, "medium").toLowerCase(),
      status: "todo",
    })),
    risks: [
      { content: "요구사항 범위가 커지면 인증, 권한, 데이터 모델이 뒤섞일 수 있습니다.", severity: "medium" },
    ],
    acceptanceCriteria: ["핵심 사용자 흐름이 성공/실패 케이스 모두에서 검증된다."],
    testCases: [
      {
        title: "핵심 요구사항 흐름 검증",
        given: "사용자가 필요한 입력값을 준비했을 때",
        when: "기능을 실행하면",
        then: "요구사항에 맞는 성공 결과 또는 명확한 오류 메시지가 표시된다.",
      },
    ],
    meta: analysis.meta || {},
  };
}

export function aiResultToLegacyAnalysis(result) {
  const normalized = normalizeAiRequirementResult(result);
  if (!normalized) return null;

  return {
    id: normalized.id,
    meta: {
      input: normalized.meta?.input || "",
      detectedRequirements: normalized.functionalRequirements.slice(0, 3),
      detectedDomains: [],
      summary: normalized.summary,
      savedAt: normalized.meta?.savedAt,
    },
    functional: normalized.functionalRequirements,
    ui: normalized.uiRequirements,
    api: normalized.apiDesign,
    database: normalized.databaseSchema.map((table) => ({
      name: table.tableName,
      columns: table.columns.map((column) => ({
        name: column.name,
        type: column.type,
        key: /primary/i.test(column.constraint) ? "PK" : /foreign|references/i.test(column.constraint) ? "FK" : "",
        description: column.constraint,
      })),
    })),
    relationships: normalized.erdRelations,
    tasks: normalized.tasks.map((task) => ({
      title: task.title,
      description: task.description,
      priority: priorityLabels[task.priority] || "Medium",
      status: statusLabels[task.status] || "Todo",
    })),
  };
}

export function getTaskKey(task) {
  return `${task.title.trim().toLowerCase()}::${task.description.trim().toLowerCase()}`;
}

export function calculateRequirementQualityScore(result) {
  const analysis = normalizeAiRequirementResult(result);
  if (!analysis) {
    return { total: 0, clarity: 0, completeness: 0, feasibility: 0, testability: 0 };
  }

  const clarity = Math.min(100, 35 + analysis.summary.length * 0.8 + analysis.functionalRequirements.length * 10);
  const completeness = Math.min(
    100,
    10 +
      analysis.functionalRequirements.length * 8 +
      analysis.nonFunctionalRequirements.length * 7 +
      analysis.uiRequirements.length * 6 +
      analysis.apiDesign.length * 8 +
      analysis.databaseSchema.length * 8 +
      analysis.risks.length * 5
  );
  const feasibility = Math.min(
    100,
    30 + analysis.tasks.length * 7 + analysis.apiDesign.length * 6 + analysis.erdRelations.length * 4
  );
  const testability = Math.min(100, 20 + analysis.acceptanceCriteria.length * 10 + analysis.testCases.length * 12);
  const total = Math.round((clarity + completeness + feasibility + testability) / 4);

  return {
    total,
    clarity: Math.round(clarity),
    completeness: Math.round(completeness),
    feasibility: Math.round(feasibility),
    testability: Math.round(testability),
  };
}

export function getApiSpecText(result) {
  const analysis = normalizeAiRequirementResult(result);
  if (!analysis) return "";

  return analysis.apiDesign
    .map((api) => {
      return [
        `${api.method} ${api.path}`,
        api.description,
        `Request: ${JSON.stringify(api.requestBody, null, 2)}`,
        `Response: ${JSON.stringify(api.responseBody, null, 2)}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function exportRequirementMarkdown(result) {
  const analysis = normalizeAiRequirementResult(result);
  if (!analysis) return "";

  const list = (items) => items.map((item) => `- ${item}`).join("\n") || "- 없음";
  const objectList = (items, formatter) => items.map(formatter).join("\n") || "- 없음";

  return `# AI 요구사항 분석

## 요약
${analysis.summary}

## 기능 요구사항
${list(analysis.functionalRequirements)}

## 비기능 요구사항
${list(analysis.nonFunctionalRequirements)}

## UI 요구사항
${list(analysis.uiRequirements)}

## API 설계
${objectList(analysis.apiDesign, (api) => `- \`${api.method} ${api.path}\`: ${api.description}`)}

## 데이터베이스 스키마
${objectList(analysis.databaseSchema, (table) => `- ${table.tableName}: ${table.columns.map((column) => `${column.name} ${column.type} ${column.constraint}`.trim()).join(", ")}`)}

## ERD 관계
${objectList(analysis.erdRelations, (relation) => `- ${relation.from} -> ${relation.to} (${relation.type})`)}

## 작업 분해
${objectList(analysis.tasks, (task) => `- [${task.priority}] ${task.title}: ${task.description}`)}

## 리스크
${objectList(analysis.risks, (risk) => `- [${risk.severity}] ${risk.content}`)}

## 인수 조건
${list(analysis.acceptanceCriteria)}

## 테스트 케이스
${objectList(analysis.testCases, (testCase) => `- ${testCase.title}
  - Given: ${testCase.given}
  - When: ${testCase.when}
  - Then: ${testCase.then}`)}
`;
}
