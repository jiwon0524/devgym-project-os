import { ApiError } from "./apiError.js";

const buckets = new Map();

export function assertRateLimit({
  key,
  limit = Number(process.env.AI_RATE_LIMIT_MAX || 10),
  windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60_000),
}) {
  const now = Date.now();
  const bucket = buckets.get(key) || [];
  const recent = bucket.filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= limit) {
    const retryAfterMs = windowMs - (now - recent[0]);
    throw new ApiError("AI 분석 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", {
      statusCode: 429,
      code: "RATE_LIMITED",
      retryAfterMs,
    });
  }

  recent.push(now);
  buckets.set(key, recent);
}
