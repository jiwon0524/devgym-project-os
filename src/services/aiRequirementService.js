import { analyzeRequirement } from "../features/requirements/analyzeRequirement.js";
import { legacyAnalysisToAiResult, normalizeAiRequirementResult } from "../features/requirements/aiRequirementUtils.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

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
    const fallback = legacyAnalysisToAiResult(analyzeRequirement(input));
    return {
      ...fallback,
      meta: {
        ...fallback.meta,
        provider: "local-fallback",
        input,
        warning:
          error.code === "OPENAI_KEY_MISSING"
            ? "AI 서버 키가 없어 로컬 분석으로 임시 실행했습니다."
            : "AI 서버 연결에 실패해 로컬 분석으로 임시 실행했습니다.",
      },
    };
  }
}
