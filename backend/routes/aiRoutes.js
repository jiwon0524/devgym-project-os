import { analyzeRequirementWithAi } from "../services/aiService.js";
import { runAiCompanyWorkflow } from "../services/companyAutomationService.js";
import { checkSupabaseConnection, fetchLatestCompanyRun, saveCompanyRun } from "../services/companyRunStore.js";
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

    const data = await analyzeRequirementWithAi({
      projectId: body.projectId,
      input: body.input,
    });

    sendJson(response, 200, { success: true, data });
  } catch (error) {
    const isMissingKey = error.message.includes("OPENAI_API_KEY");
    const statusCode = error.statusCode || (isMissingKey ? 503 : 400);
    sendJson(response, statusCode, {
      success: false,
      error: isMissingKey
        ? "AI 서버 설정이 아직 완료되지 않았습니다. OPENAI_API_KEY를 백엔드 환경변수로 설정하세요."
        : error.message,
      code: isMissingKey ? "OPENAI_KEY_MISSING" : error.code || "AI_ANALYSIS_FAILED",
    });
  }
}

async function handleCompanyRun(request, response) {
  try {
    const body = await readJsonBody(request);
    assertRateLimit({ key: "ai-company:local" });

    const data = await runAiCompanyWorkflow({
      command: body.command,
      projectName: body.projectName,
      mission: body.mission,
    });
    const persistence = await saveCompanyRun({
      command: body.command,
      projectName: body.projectName,
      mission: body.mission,
      result: data,
    });

    sendJson(response, 200, { success: true, data: { ...data, persisted: persistence } });
  } catch (error) {
    const isMissingKey = error.message.includes("OPENAI_API_KEY");
    sendJson(response, isMissingKey ? 503 : 400, {
      success: false,
      error: isMissingKey
        ? "OpenAI API 키가 백엔드에 설정되어 있지 않습니다. .env.local을 확인하세요."
        : error.message,
      code: isMissingKey ? "OPENAI_KEY_MISSING" : "AI_COMPANY_RUN_FAILED",
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

  if (request.method === "GET" && url.pathname === "/api/ai/company-runs/latest") {
    await handleLatestCompanyRun(request, response);
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/ai/status") {
    await handleIntegrationStatus(response);
    return true;
  }

  if (request.method !== "POST") return false;

  if (url.pathname === "/api/ai/analyze-requirement") {
    await handleRequirementAnalysis(request, response);
    return true;
  }

  if (url.pathname === "/api/ai/company-run") {
    await handleCompanyRun(request, response);
    return true;
  }

  return false;
}
