import { normalizeAiRequirementResult } from "./aiRequirementUtils.js";

function pickByIndex(items, index) {
  if (!items.length) return null;
  return items[index % items.length];
}

function mermaidText(value) {
  return String(value || "")
    .replace(/["]/g, "'")
    .replace(/[(){}[\]:;]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 56) || "요구사항";
}

function getActor(analysis) {
  const joined = [
    analysis.summary,
    ...analysis.functionalRequirements,
    ...analysis.uiRequirements,
  ].join(" ");

  if (/관리자|admin/i.test(joined)) return "관리자";
  if (/팀|멤버|댓글|협업/.test(joined)) return "팀원";
  return "사용자";
}

function makeRequirementId(index) {
  return `REQ-${String(index + 1).padStart(3, "0")}`;
}

function makeTaskId(index) {
  return `TASK-${String(index + 1).padStart(3, "0")}`;
}

function buildUseCaseDiagram(analysis, actor) {
  const useCases = analysis.functionalRequirements.slice(0, 6);
  const lines = [
    "flowchart LR",
    `  actor["${actor}"]`,
    `  system["ProjectOS"]`,
  ];

  useCases.forEach((requirement, index) => {
    lines.push(`  uc${index + 1}(["${mermaidText(requirement)}"])`);
    lines.push(`  actor --> uc${index + 1}`);
    lines.push(`  uc${index + 1} --> system`);
  });

  if (!useCases.length) {
    lines.push(`  uc1(["${mermaidText(analysis.summary)}"])`);
    lines.push("  actor --> uc1 --> system");
  }

  return lines.join("\n");
}

function buildSequenceDiagram(analysis, actor) {
  const api = analysis.apiDesign[0];
  const table = analysis.databaseSchema[0];
  const action = analysis.functionalRequirements[0] || analysis.summary;

  return [
    "sequenceDiagram",
    `  participant U as ${actor}`,
    "  participant FE as React UI",
    "  participant API as Backend API",
    "  participant DB as Supabase DB",
    `  U->>FE: ${mermaidText(action)}`,
    api ? `  FE->>API: ${api.method} ${api.path}` : "  FE->>API: 요청 전송",
    table ? `  API->>DB: ${table.tableName} 저장/조회` : "  API->>DB: 데이터 저장/조회",
    "  DB-->>API: 처리 결과",
    "  API-->>FE: 응답 반환",
    "  FE-->>U: 결과 표시",
  ].join("\n");
}

function buildActivityDiagram(analysis) {
  const firstTask = analysis.tasks[0]?.title || "요구사항 확인";
  const firstTest = analysis.testCases[0]?.title || "인수 조건 검증";

  return [
    "flowchart TD",
    '  start([시작])',
    `  input["${mermaidText(analysis.summary)}"]`,
    '  analyze["요구사항 구조화"]',
    `  task["${mermaidText(firstTask)}"]`,
    `  test["${mermaidText(firstTest)}"]`,
    '  done([완료])',
    "  start --> input --> analyze --> task --> test --> done",
  ].join("\n");
}

function buildStateDiagram(analysis) {
  const hasReviewRisk = analysis.risks.some((risk) => risk.severity === "high");

  return [
    "stateDiagram-v2",
    "  [*] --> Draft",
    "  Draft --> Review: 요구사항 작성",
    hasReviewRisk ? "  Review --> Draft: 고위험 보완" : "  Review --> Approved: 검토 통과",
    "  Approved --> Implementing: 작업 생성",
    "  Implementing --> Testing: 구현 완료",
    "  Testing --> Done: 인수 조건 충족",
    "  Done --> [*]",
  ].join("\n");
}

function buildPrd(analysis) {
  const actor = getActor(analysis);
  return {
    title: analysis.summary || "프로젝트 요구사항",
    problem: `${actor}가 현재 업무 흐름에서 겪는 요구를 제품 기능으로 구조화합니다.`,
    targetUsers: [actor, "프로젝트 관리자", "개발자", "QA 담당자"],
    goals: [
      ...analysis.functionalRequirements.slice(0, 4),
      "요구사항에서 작업과 테스트까지 추적 가능한 개발 흐름을 만든다.",
    ],
    scope: [
      ...analysis.uiRequirements.slice(0, 3),
      ...analysis.apiDesign.slice(0, 3).map((api) => `${api.method} ${api.path}`),
      ...analysis.databaseSchema.slice(0, 3).map((table) => `${table.tableName} 데이터 모델`),
    ].filter(Boolean),
    outOfScope: [
      "결제, 정산, 외부 운영 시스템 연동은 이번 범위에서 제외",
      "대규모 권한 정책 자동화는 기본 역할 정책 검증 후 확장",
    ],
    successMetrics: [
      "핵심 사용자 흐름 성공률 95% 이상",
      "주요 API 오류율 1% 미만",
      "인수 조건 충족률 100%",
      "회귀 테스트 통과 후 배포",
    ],
  };
}

function buildTestPlan(analysis) {
  return {
    strategy: [
      "요구사항별 인수 조건을 기준으로 기능 테스트를 작성한다.",
      "API와 DB 저장 흐름은 통합 테스트로 검증한다.",
      "권한, 예외, 빈 상태, 실패 상태를 회귀 테스트에 포함한다.",
    ],
    levels: [
      { name: "단위 테스트", target: "요구사항 변환 로직, 권한 helper, 데이터 mapper" },
      { name: "통합 테스트", target: "API 요청, Supabase 저장, RPC 트랜잭션" },
      { name: "E2E 테스트", target: "프로젝트 생성, AI 분석, 작업 생성, 댓글 작성" },
      { name: "권한 테스트", target: "Owner/Admin/Member/Viewer별 편집 가능 범위" },
    ],
    entryCriteria: [
      "PRD와 인수 조건이 작성됨",
      "API/DB 변경 범위가 확인됨",
      "테스트 데이터와 권한 계정이 준비됨",
    ],
    exitCriteria: [
      "모든 인수 조건이 통과됨",
      "고위험 리스크 대응이 완료됨",
      "주요 브라우저 스모크 테스트가 통과됨",
    ],
    regressionAreas: [
      ...analysis.apiDesign.slice(0, 3).map((api) => `${api.method} ${api.path}`),
      ...analysis.databaseSchema.slice(0, 3).map((table) => `${table.tableName} 저장/조회`),
      "로그인/권한/동기화 흐름",
    ],
  };
}

function buildTraceability(analysis) {
  const requirements = [
    ...analysis.functionalRequirements.map((content, index) => ({ type: "기능", content, index })),
    ...analysis.nonFunctionalRequirements.map((content, index) => ({
      type: "비기능",
      content,
      index: analysis.functionalRequirements.length + index,
    })),
  ];

  return requirements.map((requirement, index) => {
    const api = pickByIndex(analysis.apiDesign, index);
    const table = pickByIndex(analysis.databaseSchema, index);
    const task = pickByIndex(analysis.tasks, index);
    const testCase = pickByIndex(analysis.testCases, index);
    const risk = pickByIndex(analysis.risks, index);

    return {
      id: makeRequirementId(index),
      type: requirement.type,
      requirement: requirement.content,
      api: api ? `${api.method} ${api.path}` : "-",
      data: table?.tableName || "-",
      task: task ? `${makeTaskId(index)} ${task.title}` : "-",
      test: testCase?.title || "-",
      risk: risk?.content || "-",
      status: task?.status || "todo",
    };
  });
}

function buildMarkdown(artifacts) {
  const list = (items) => items.map((item) => `- ${item}`).join("\n");
  const testLevels = artifacts.testPlan.levels.map((item) => `- ${item.name}: ${item.target}`).join("\n");
  const traceRows = artifacts.traceability
    .map((row) => `| ${row.id} | ${row.type} | ${row.requirement} | ${row.api} | ${row.data} | ${row.task} | ${row.test} |`)
    .join("\n");

  return `# ${artifacts.prd.title}

## PRD

### 문제 정의
${artifacts.prd.problem}

### 목표
${list(artifacts.prd.goals)}

### 범위
${list(artifacts.prd.scope)}

### 성공 지표
${list(artifacts.prd.successMetrics)}

## UML

### Use Case
\`\`\`mermaid
${artifacts.uml.useCase}
\`\`\`

### Sequence
\`\`\`mermaid
${artifacts.uml.sequence}
\`\`\`

### Activity
\`\`\`mermaid
${artifacts.uml.activity}
\`\`\`

### State
\`\`\`mermaid
${artifacts.uml.state}
\`\`\`

## 테스트 계획
${list(artifacts.testPlan.strategy)}

### 테스트 레벨
${testLevels}

## 추적 매트릭스
| ID | 유형 | 요구사항 | API | 데이터 | 작업 | 테스트 |
| --- | --- | --- | --- | --- | --- | --- |
${traceRows || "| - | - | - | - | - | - | - |"}
`;
}

export function buildEngineeringArtifacts(result) {
  const analysis = normalizeAiRequirementResult(result);
  if (!analysis) return null;
  const actor = getActor(analysis);

  const artifacts = {
    prd: buildPrd(analysis),
    uml: {
      useCase: buildUseCaseDiagram(analysis, actor),
      sequence: buildSequenceDiagram(analysis, actor),
      activity: buildActivityDiagram(analysis),
      state: buildStateDiagram(analysis),
    },
    testPlan: buildTestPlan(analysis),
    traceability: buildTraceability(analysis),
  };

  return {
    ...artifacts,
    markdown: buildMarkdown(artifacts),
  };
}
