import { analyzeRequirementWithAi } from "../services/aiService.js";
import { rewriteArtifactWithOwnerComment, runAiCompanyWorkflow, selectAgents } from "../services/companyAutomationService.js";
import {
  appendRunNotification,
  checkSupabaseConnection,
  createQueuedCompanyRun,
  fetchCompanyRun,
  fetchLatestCompanyRun,
  listAiCompanyProjects,
  replaceRunDeliverables,
  replaceRunNotifications,
  reviseDeliverableWithOwnerComment,
  saveCompanyRun,
  updateCompanyRun,
} from "../services/companyRunStore.js";
import { authorizeProjectAccess, getBearerToken } from "../services/supabaseAuthService.js";
import { assertRateLimit } from "../utils/rateLimiter.js";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "http://127.0.0.1:5173",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}

async function handleRequirementAnalysis(request, response) {
  try {
    const body = await readJsonBody(request);
    const token = getBearerToken(request);
    const { user } = await authorizeProjectAccess({ token, projectId: body.projectId });
    assertRateLimit({ key: `ai:${user.id}` });

    const data = await analyzeRequirementWithAi({ projectId: body.projectId, input: body.input });
    sendJson(response, 200, { success: true, data });
  } catch (error) {
    const isMissingKey = error.message.includes("OPENAI_API_KEY");
    const statusCode = error.statusCode || (isMissingKey ? 503 : 400);
    sendJson(response, statusCode, {
      success: false,
      error: isMissingKey ? "AI 서버 설정이 완료되지 않았습니다. OPENAI_API_KEY를 백엔드 환경변수로 설정하세요." : error.message,
      code: isMissingKey ? "OPENAI_KEY_MISSING" : error.code || "AI_ANALYSIS_FAILED",
    });
  }
}

async function handleCompanyRun(request, response) {
  try {
    const body = await readJsonBody(request);
    assertRateLimit({ key: "ai-company:local" });

    const data = await runAiCompanyWorkflow({ command: body.command, projectName: body.projectName, mission: body.mission });
    const persistence = await saveCompanyRun({ command: body.command, projectName: body.projectName, mission: body.mission, method: body.method, result: data });

    sendJson(response, 200, { success: true, data: { ...data, persisted: persistence } });
  } catch (error) {
    const isMissingKey = error.message.includes("OPENAI_API_KEY");
    sendJson(response, isMissingKey ? 503 : 400, {
      success: false,
      error: isMissingKey ? "OpenAI API 키가 백엔드에 설정되어 있지 않습니다. .env.local을 확인하세요." : error.message,
      code: isMissingKey ? "OPENAI_KEY_MISSING" : "AI_COMPANY_RUN_FAILED",
    });
  }
}

async function startCompanyRun(request, response) {
  try {
    const body = await readJsonBody(request);
    const command = String(body.command || "").trim();
    const projectName = String(body.projectName || "").trim();
    if (!command) throw new Error("OWNER 명령이 필요합니다.");
    if (!projectName) throw new Error("프로젝트 이름이 필요합니다.");

    assertRateLimit({ key: "ai-company:start" });
    const selectedAgents = selectAgents(command);
    const queued = await createQueuedCompanyRun({
      command,
      projectName,
      mission: body.mission || command,
      method: body.method || "agile",
      selectedAgents,
    });
    if (!queued.ok) throw new Error(queued.error || "Supabase 실행 기록 생성에 실패했습니다.");

    void processCompanyRunInBackground({
      runId: queued.run.id,
      command,
      projectName,
      mission: body.mission || command,
      method: body.method || "agile",
      selectedAgents,
    });

    sendJson(response, 202, {
      success: true,
      data: {
        runId: queued.run.id,
        projectId: queued.project?.id || null,
        status: "queued",
        selectedAgents,
        message: "서버 자동화 실행이 등록되었습니다.",
      },
    });
  } catch (error) {
    sendJson(response, 400, { success: false, error: error.message, code: "AI_COMPANY_QUEUE_FAILED" });
  }
}

async function processCompanyRunInBackground({ runId, command, projectName, mission, method, selectedAgents }) {
  try {
    await updateCompanyRun(runId, {
      status: "running",
      selected_agents: selectedAgents,
      current_agent: "ceo",
      current_phase: "프로젝트 접수 및 역할 배정",
    });
    await appendRunNotification(runId, { agentId: "ceo", title: "서버 자동화 시작", body: `${projectName} 프로젝트를 AI 직원들에게 배정했습니다.`, tone: "info" });

    const phases = [
      ["strategy", "도메인과 성공지표 분석"],
      ["pm", "PRD와 요구사항 명세 작성"],
      ["ux", "사용자 흐름과 UML 설계"],
      ["arch", "API/DB/권한 구조 설계"],
      ["dev", "WBS와 작업 단위 분해"],
      ["qa", "테스트 시나리오와 예외상황 검증"],
      ["ops", "릴리즈와 운영 알림 정리"],
      ["ceo", "OWNER 검토본 패키징"],
    ].filter(([agentId]) => selectedAgents.includes(agentId));

    for (const [agentId, phase] of phases) {
      await updateCompanyRun(runId, { status: "running", current_agent: agentId, current_phase: phase });
      await appendRunNotification(runId, { agentId, title: "AI 직원 작업중", body: `${phase} 단계가 진행 중입니다.`, tone: "info" });
    }

    const result = await runAiCompanyWorkflow({ command, projectName, mission, method });
    await replaceRunDeliverables(runId, result.artifacts);
    await replaceRunNotifications(runId, result.notifications);
    await updateCompanyRun(runId, {
      status: "completed",
      current_agent: "ceo",
      current_phase: "OWNER 최종 검토 대기",
      selected_agents: result.selectedAgents || selectedAgents,
      result: { ...result, method },
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    await updateCompanyRun(runId, {
      status: "failed",
      current_phase: "자동화 실패",
      error_message: error.message || "AI company automation failed",
      result: { error: error.message || "AI company automation failed" },
    });
    await appendRunNotification(runId, { agentId: "ops", title: "서버 자동화 실패", body: error.message || "자동화 실행 중 오류가 발생했습니다.", tone: "warning" });
  }
}

async function handleCompanyRunStatus(request, response, runId) {
  const result = await fetchCompanyRun(runId);
  sendJson(response, result.found ? 200 : 404, { success: result.found, data: result, error: result.error });
}


async function handleCompanyProjects(response) {
  const result = await listAiCompanyProjects();
  sendJson(response, result.ok ? 200 : 400, { success: result.ok, data: result.data || [], error: result.error });
}

async function handleDeliverableOwnerComment(request, response, runId) {
  try {
    const body = await readJsonBody(request);
    const type = String(body.type || "").trim();
    const title = String(body.title || "").trim();
    const ownerComment = String(body.comment || "").trim();
    if (!type || !title || !ownerComment) throw new Error("??? ??, ??, OWNER ???? ?????.");

    assertRateLimit({ key: "ai-company:comment" });
    const currentRun = await fetchCompanyRun(runId);
    if (!currentRun.found) throw new Error(currentRun.error || "?? ??? ?? ? ????.");
    const artifacts = currentRun.data?.artifacts?.[type] || currentRun.run?.result?.artifacts?.[type] || [];
    const artifact = artifacts.find((item) => item?.title === title) || artifacts[0];
    if (!artifact) throw new Error("???? ???? ?? ? ????.");

    const revised = await rewriteArtifactWithOwnerComment({
      projectName: currentRun.run.project_name,
      artifactTitle: title,
      artifactType: type,
      artifactBody: artifact.body,
      ownerComment,
      agentId: artifact.ownerId,
    });
    const saved = await reviseDeliverableWithOwnerComment({ runId, type, title, ownerComment, revised });
    if (!saved.ok) throw new Error(saved.error || "??? ??? ??? ??????.");
    const latest = await fetchCompanyRun(runId);
    sendJson(response, 200, { success: true, data: { revised: saved.data, run: latest } });
  } catch (error) {
    const isMissingKey = error.message.includes("OPENAI_API_KEY");
    sendJson(response, isMissingKey ? 503 : 400, {
      success: false,
      error: isMissingKey ? "OpenAI API ?? ???? ???? ?? ????." : error.message,
      code: isMissingKey ? "OPENAI_KEY_MISSING" : "AI_DELIVERABLE_REWRITE_FAILED",
    });
  }
}

async function handleLatestCompanyRun(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const projectName = url.searchParams.get("projectName") || undefined;
  const latest = await fetchLatestCompanyRun(projectName);
  sendJson(response, 200, { success: true, data: latest });
}

async function handleIntegrationStatus(response) {
  const supabase = await checkSupabaseConnection();
  sendJson(response, 200, {
    success: true,
    data: {
      openai: { configured: Boolean(process.env.OPENAI_API_KEY), connected: Boolean(process.env.OPENAI_API_KEY) },
      supabase,
      github: { configured: Boolean(process.env.GITHUB_APP_ID || process.env.GITHUB_TOKEN), connected: false },
      kakao: { configured: Boolean(process.env.KAKAO_REST_API_KEY), connected: false },
    },
  });
}

export async function handleAiRoutes(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS" && url.pathname.startsWith("/api/ai/")) {
    sendJson(response, 204, {});
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/ai/company-projects") {
    await handleCompanyProjects(response);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/ai/company-runs/latest") {
    await handleLatestCompanyRun(request, response);
    return true;
  }

  const runStatusMatch = url.pathname.match(/^\/api\/ai\/company-runs\/([^/]+)$/);
  if (request.method === "GET" && runStatusMatch) {
    await handleCompanyRunStatus(request, response, runStatusMatch[1]);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/ai/status") {
    await handleIntegrationStatus(response);
    return true;
  }

  const deliverableCommentMatch = url.pathname.match(/^\/api\/ai\/company-runs\/([^/]+)\/deliverables\/comment$/);
  if (request.method === "POST" && deliverableCommentMatch) {
    await handleDeliverableOwnerComment(request, response, deliverableCommentMatch[1]);
    return true;
  }

  if (request.method !== "POST") return false;

  if (url.pathname === "/api/ai/analyze-requirement") {
    await handleRequirementAnalysis(request, response);
    return true;
  }

  if (url.pathname === "/api/ai/company-runs") {
    await startCompanyRun(request, response);
    return true;
  }

  if (url.pathname === "/api/ai/company-run") {
    await handleCompanyRun(request, response);
    return true;
  }

  return false;
}
