import { analyzeRequirementWithAi } from "../services/aiService.js";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "http://127.0.0.1:5173",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

export async function handleAiRoutes(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "OPTIONS" && url.pathname.startsWith("/api/ai/")) {
    sendJson(response, 204, {});
    return true;
  }

  if (request.method !== "POST" || url.pathname !== "/api/ai/analyze-requirement") {
    return false;
  }

  try {
    const body = await readJsonBody(request);
    const data = await analyzeRequirementWithAi({
      projectId: body.projectId,
      input: body.input,
    });

    sendJson(response, 200, { success: true, data });
  } catch (error) {
    const isMissingKey = error.message.includes("OPENAI_API_KEY");
    sendJson(response, isMissingKey ? 503 : 400, {
      success: false,
      error: isMissingKey
        ? "AI 서버 키가 설정되지 않았습니다. OPENAI_API_KEY를 backend 환경변수로 설정하세요."
        : error.message,
      code: isMissingKey ? "OPENAI_KEY_MISSING" : "AI_ANALYSIS_FAILED",
    });
  }

  return true;
}
