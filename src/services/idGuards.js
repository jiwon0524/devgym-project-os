const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && uuidPattern.test(value);
}

export function assertUuid(value, label) {
  if (!isUuid(value)) {
    throw new Error(`${label}가 올바르지 않습니다. 먼저 실제 워크스페이스와 프로젝트를 선택하세요.`);
  }
}
