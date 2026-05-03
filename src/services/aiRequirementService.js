import { analyzeRequirement } from "../features/requirements/analyzeRequirement.js";
import { legacyAnalysisToAiResult, normalizeAiRequirementResult } from "../features/requirements/aiRequirementUtils.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const isDevFallbackEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_AI_FALLBACK === "true";

function buildAiEndpoint() {
  return `${API_BASE_URL}/api/ai/analyze-requirement`;
}

export async function analyzeRequirementWithBackend({ projectId, input }) {
  const response = await fetch(buildAiEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ projectId, input }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.success) {
    const error = new Error(payload.error || "AI 분석 서버 요청에 실패했습니다.");
    error.code = payload.code || "AI_REQUEST_FAILED";
    throw error;
  }

  const normalized = normalizeAiRequirementResult(payload.data);
  if (!normalized) {
    throw new Error("AI 분석 결과를 화면 형식으로 변환하지 못했습니다.");
  }

  return {
    ...normalized,
    meta: {
      ...normalized.meta,
      provider: "openai",
      input,
    },
  };
}

export async function analyzeRequirementWithFallback({ projectId, input }) {
  try {
    return await analyzeRequirementWithBackend({ projectId, input });
  } catch (error) {
    if (!isDevFallbackEnabled) {
      throw error;
    }

    const fallback = legacyAnalysisToAiResult(analyzeRequirement(input));
    return {
      ...fallback,
      meta: {
        ...fallback.meta,
        provider: "local-fallback",
        fallback: true,
        input,
        warning:
          error.code === "OPENAI_KEY_MISSING"
            ? "개발 모드라 OpenAI 키 없이 로컬 분석을 표시했습니다. 실제 AI 결과가 아니므로 운영 저장 전 API 연결을 확인하세요."
            : "개발 모드라 AI 서버 오류 대신 로컬 분석을 표시했습니다. 실제 AI 결과가 아니므로 운영 저장 전 API 연결을 확인하세요.",
      },
    };
  }
}
