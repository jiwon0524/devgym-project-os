const COMPANY_SYSTEM_PROMPT = `You are an AI company operating system for practical software project management.
The user is the CEO. Multiple AI employees collaborate as departments: CEO, Strategy, PM, UX, Architect, Developer, QA, Operations.
Return only valid JSON. All natural language content must be Korean.
Make outputs practical, specific, and usable for real software engineering work.
Never mention that this is a demo.`;

const agentProfiles = {
  ceo: { name: "대표총괄AI", role: "CEO", title: "목표/우선순위/승인" },
  strategy: { name: "전략기획AI", role: "전략", title: "시장/범위/MVP" },
  pm: { name: "요구사항AI", role: "PM", title: "PRD/요구사항" },
  ux: { name: "UX설계AI", role: "UX", title: "화면/흐름/UML" },
  arch: { name: "기술설계AI", role: "아키텍트", title: "API/DB/보안" },
  dev: { name: "개발관리AI", role: "개발", title: "WBS/GitHub/PR" },
  qa: { name: "품질검증AI", role: "QA", title: "TC/결함/릴리즈" },
  ops: { name: "배포운영AI", role: "운영", title: "배포/알림/모니터링" },
};

const allowedAgentIds = Object.keys(agentProfiles);

function selectAgents(command) {
  const text = command.toLowerCase();
  if (text.includes("api") || text.includes("연동") || text.includes("github") || text.includes("깃허브")) return ["ceo", "arch", "dev", "ops", "qa"];
  if (text.includes("uml") || text.includes("설계") || text.includes("erd")) return ["ceo", "ux", "arch", "pm"];
  if (text.includes("테스트") || text.includes("qa") || text.includes("릴리즈")) return ["ceo", "qa", "dev", "ops"];
  if (text.includes("부족") || text.includes("개선") || text.includes("실무") || text.includes("현업")) return ["ceo", "strategy", "pm", "ux", "arch", "dev", "qa"];
  return allowedAgentIds;
}

function buildCompanyPrompt({ command, projectName, mission, selectedAgents }) {
  return `Project name: ${projectName || "AI Project"}
Current mission: ${mission || command}
CEO command: ${command}
Selected AI employees: ${selectedAgents.map((id) => `${id}:${agentProfiles[id].name}`).join(", ")}

Create a coordinated company workflow result.
Return JSON exactly matching this shape:
{
  "messages": [{ "agentId": "ceo", "body": "...", "tasks": ["...", "..."] }],
  "notifications": [{ "title": "...", "body": "...", "tone": "success" }],
  "automationLog": { "title": "...", "body": "..." },
  "artifacts": {
    "prd": [{ "title": "...", "body": "..." }],
    "wbs": [{ "title": "...", "body": "..." }],
    "uml": [{ "title": "...", "body": "..." }],
    "api": [{ "title": "...", "body": "..." }],
    "qa": [{ "title": "...", "body": "..." }],
    "risk": [{ "title": "...", "body": "..." }],
    "release": [{ "title": "...", "body": "..." }],
    "integrations": [{ "title": "...", "body": "..." }],
    "final": [{ "title": "...", "body": "..." }]
  }
}

Rules:
- messages must include one item for each selected AI employee.
- agentId must be one of: ${allowedAgentIds.join(", ")}.
- tasks must be concrete and short.
- notifications explain what was just created or updated.
- final must summarize the completed deliverable for CEO review.
- If the project is about a university academic system, use university-specific details such as students, professors, teaching assistants, courses, assignments, attendance, counseling, and notices.`;
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

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && typeof row.title === "string" && typeof row.body === "string")
    .slice(0, 8)
    .map((row) => ({ title: row.title, body: row.body }));
}

function normalizeCompanyRun(raw, selectedAgents) {
  const messages = Array.isArray(raw.messages) ? raw.messages : [];
  return {
    messages: messages
      .filter((message) => selectedAgents.includes(message.agentId))
      .map((message) => ({
        agentId: message.agentId,
        body: String(message.body || "업무 결과를 정리했습니다."),
        tasks: Array.isArray(message.tasks) ? message.tasks.slice(0, 5).map(String) : ["산출물 정리"],
      })),
    notifications: (Array.isArray(raw.notifications) ? raw.notifications : [])
      .slice(0, 4)
      .map((item) => ({
        title: String(item.title || "산출물 갱신"),
        body: String(item.body || "AI 직원들이 산출물을 업데이트했습니다."),
        tone: ["success", "info", "warning"].includes(item.tone) ? item.tone : "info",
      })),
    automationLog: {
      title: String(raw.automationLog?.title || "AI 직원 자동 협업"),
      body: String(raw.automationLog?.body || `${selectedAgents.map((id) => agentProfiles[id].name).join(" → ")} 순서로 업무를 진행했습니다.`),
    },
    artifacts: {
      prd: normalizeRows(raw.artifacts?.prd),
      wbs: normalizeRows(raw.artifacts?.wbs),
      uml: normalizeRows(raw.artifacts?.uml),
      api: normalizeRows(raw.artifacts?.api),
      qa: normalizeRows(raw.artifacts?.qa),
      risk: normalizeRows(raw.artifacts?.risk),
      release: normalizeRows(raw.artifacts?.release),
      integrations: normalizeRows(raw.artifacts?.integrations),
      final: normalizeRows(raw.artifacts?.final),
    },
  };
}

export async function runAiCompanyWorkflow({ command, projectName, mission }) {
  if (!command?.trim()) throw new Error("대표 명령이 필요합니다.");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const selectedAgents = selectAgents(command);
  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: COMPANY_SYSTEM_PROMPT }] },
        { role: "user", content: [{ type: "input_text", text: buildCompanyPrompt({ command, projectName, mission, selectedAgents }) }] },
      ],
      text: { format: { type: "json_object" } },
      reasoning: { effort: "low" },
      max_output_tokens: 7000,
    }),
  });

  const responseJson = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(responseJson.error?.message || `OpenAI API request failed (${response.status})`);
  }

  const text = extractResponseText(responseJson);
  const parsed = JSON.parse(text);
  return {
    selectedAgents,
    ...normalizeCompanyRun(parsed, selectedAgents),
  };
}
