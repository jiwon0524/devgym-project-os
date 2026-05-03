const commonColumns = {
  id: { name: "id", type: "uuid", key: "PK", description: "고유 식별자" },
  createdAt: { name: "created_at", type: "timestamp", description: "생성 시각" },
  updatedAt: { name: "updated_at", type: "timestamp", description: "수정 시각" },
};

const featureRules = [
  {
    id: "auth",
    label: "인증",
    keywords: ["로그인", "회원가입", "로그아웃", "인증", "비밀번호", "login", "signup", "logout", "auth"],
    functional: [
      "사용자는 회원가입할 수 있어야 한다.",
      "사용자는 로그인할 수 있어야 한다.",
      "사용자는 로그아웃할 수 있어야 한다.",
      "비밀번호 유효성 검사가 필요하다.",
    ],
    ui: [
      "로그인 페이지가 필요하다.",
      "회원가입 페이지가 필요하다.",
      "이메일, 비밀번호 입력 필드가 필요하다.",
      "입력 오류와 인증 실패 메시지를 보여줘야 한다.",
    ],
    api: [
      { method: "POST", path: "/api/auth/login", description: "이메일과 비밀번호로 세션을 생성한다." },
      { method: "POST", path: "/api/auth/signup", description: "신규 사용자를 생성한다." },
      { method: "POST", path: "/api/auth/logout", description: "현재 세션을 종료한다." },
    ],
    database: [
      {
        name: "users",
        columns: [
          commonColumns.id,
          { name: "email", type: "varchar", description: "로그인 이메일" },
          { name: "password", type: "varchar", description: "해시된 비밀번호" },
          commonColumns.createdAt,
        ],
      },
      {
        name: "sessions",
        columns: [
          commonColumns.id,
          { name: "user_id", type: "uuid", key: "FK", references: "users.id" },
          { name: "expires_at", type: "timestamp", description: "세션 만료 시각" },
          commonColumns.createdAt,
        ],
      },
    ],
    tasks: [
      { title: "로그인 UI 설계", priority: "High" },
      { title: "회원가입 UI 설계", priority: "Medium" },
      { title: "인증 API 구현", priority: "High" },
      { title: "프론트엔드와 인증 API 연결", priority: "High" },
      { title: "이메일과 비밀번호 입력 검증", priority: "Medium" },
    ],
    relationships: [{ from: "sessions.user_id", to: "users.id", type: "N:1" }],
  },
  {
    id: "task",
    label: "작업 관리",
    keywords: ["작업", "태스크", "할 일", "칸반", "상태", "우선순위", "task", "todo", "kanban"],
    functional: [
      "사용자는 작업을 생성하고 수정할 수 있어야 한다.",
      "작업에는 상태, 담당자, 우선순위를 지정할 수 있어야 한다.",
      "팀은 작업 진행 상태를 목록에서 확인할 수 있어야 한다.",
    ],
    ui: [
      "작업 목록 화면이 필요하다.",
      "상태 변경 셀렉트 박스가 필요하다.",
      "담당자와 우선순위 편집 UI가 필요하다.",
    ],
    api: [
      { method: "GET", path: "/api/tasks", description: "작업 목록을 조회한다." },
      { method: "POST", path: "/api/tasks", description: "새 작업을 생성한다." },
      { method: "PATCH", path: "/api/tasks/:id", description: "작업 상태와 속성을 수정한다." },
    ],
    database: [
      {
        name: "tasks",
        columns: [
          commonColumns.id,
          { name: "title", type: "varchar", description: "작업명" },
          { name: "status", type: "varchar", description: "할 일, 진행 중, 완료" },
          { name: "priority", type: "varchar", description: "높음, 보통, 낮음" },
          { name: "assignee_id", type: "uuid", key: "FK", references: "users.id" },
          commonColumns.createdAt,
        ],
      },
    ],
    tasks: [
      { title: "작업 목록 UI 구현", priority: "High" },
      { title: "작업 상태 변경 기능 구현", priority: "Medium" },
      { title: "담당자와 우선순위 편집 기능 구현", priority: "Medium" },
    ],
    relationships: [{ from: "tasks.assignee_id", to: "users.id", type: "N:1" }],
  },
  {
    id: "team",
    label: "팀 협업",
    keywords: ["팀", "초대", "멤버", "권한", "역할", "협업", "member", "invite", "role", "team"],
    functional: [
      "관리자는 팀원을 초대할 수 있어야 한다.",
      "팀원에게 역할을 지정할 수 있어야 한다.",
      "초대 상태를 확인할 수 있어야 한다.",
    ],
    ui: [
      "팀원 초대 입력 폼이 필요하다.",
      "역할 선택 드롭다운이 필요하다.",
      "멤버 목록과 초대 상태 배지가 필요하다.",
    ],
    api: [
      { method: "GET", path: "/api/members", description: "프로젝트 멤버를 조회한다." },
      { method: "POST", path: "/api/members/invite", description: "새 멤버를 초대한다." },
      { method: "PATCH", path: "/api/members/:id/role", description: "멤버 역할을 변경한다." },
    ],
    database: [
      {
        name: "members",
        columns: [
          commonColumns.id,
          { name: "user_id", type: "uuid", key: "FK", references: "users.id" },
          { name: "role", type: "varchar", description: "프로젝트 역할" },
          { name: "status", type: "varchar", description: "활성 또는 초대됨" },
          commonColumns.createdAt,
        ],
      },
    ],
    tasks: [
      { title: "팀원 초대 UI 구현", priority: "Medium" },
      { title: "역할 관리 API 설계", priority: "Medium" },
      { title: "멤버 상태 표시 기능 구현", priority: "Low" },
    ],
    relationships: [{ from: "members.user_id", to: "users.id", type: "N:1" }],
  },
  {
    id: "project",
    label: "프로젝트",
    keywords: ["프로젝트", "워크스페이스", "일정", "마감", "타임라인", "project", "workspace", "timeline"],
    functional: [
      "사용자는 프로젝트를 생성하고 설명을 관리할 수 있어야 한다.",
      "프로젝트별 요구사항과 작업을 분리해서 볼 수 있어야 한다.",
      "프로젝트 일정과 단계 상태를 확인할 수 있어야 한다.",
    ],
    ui: [
      "프로젝트 생성 폼이 필요하다.",
      "프로젝트 개요 화면이 필요하다.",
      "일정 단계 표시 UI가 필요하다.",
    ],
    api: [
      { method: "GET", path: "/api/projects", description: "프로젝트 목록을 조회한다." },
      { method: "POST", path: "/api/projects", description: "프로젝트를 생성한다." },
      { method: "PATCH", path: "/api/projects/:id", description: "프로젝트 정보를 수정한다." },
    ],
    database: [
      {
        name: "projects",
        columns: [
          commonColumns.id,
          { name: "name", type: "varchar", description: "프로젝트 이름" },
          { name: "description", type: "text", description: "프로젝트 설명" },
          { name: "owner_id", type: "uuid", key: "FK", references: "users.id" },
          commonColumns.createdAt,
        ],
      },
    ],
    tasks: [
      { title: "프로젝트 생성 플로우 구현", priority: "High" },
      { title: "프로젝트 개요 화면 정리", priority: "Medium" },
      { title: "프로젝트 일정 단계 UI 구현", priority: "Low" },
    ],
    relationships: [{ from: "projects.owner_id", to: "users.id", type: "N:1" }],
  },
];

const stopWords = [
  "기능",
  "만들기",
  "구현",
  "추가",
  "관리",
  "해주세요",
  "해줘",
  "필요",
  "시스템",
];

function splitRequirementInput(input) {
  return input
    .split(/\n|,|;|\/|그리고|또는|및/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, "");
}

function uniqueByText(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key =
      typeof item === "string"
        ? item
        : item.method || item.path || item.title || item.name
          ? `${item.method || ""}${item.path || ""}${item.title || ""}${item.name || ""}`
          : JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeTables(tables) {
  const tableMap = new Map();

  tables.forEach((table) => {
    if (!tableMap.has(table.name)) {
      tableMap.set(table.name, { ...table, columns: [...table.columns] });
      return;
    }

    const existing = tableMap.get(table.name);
    const columnNames = new Set(existing.columns.map((column) => column.name));
    table.columns.forEach((column) => {
      if (!columnNames.has(column.name)) {
        existing.columns.push(column);
      }
    });
  });

  return [...tableMap.values()];
}

function inferFeatureName(input) {
  const cleaned = input
    .replace(/[^\w가-힣\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !stopWords.includes(word))
    .slice(0, 3)
    .join(" ");

  return cleaned || "신규 기능";
}

function createGenericRule(input) {
  const featureName = inferFeatureName(input);
  const rawSlug = featureName
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")
    .toLowerCase();
  const slug = /[a-z0-9]/.test(rawSlug) ? rawSlug : "custom-features";

  return {
    id: "generic",
    label: featureName,
    functional: [
      `사용자는 ${featureName}을 시작하고 완료할 수 있어야 한다.`,
      `${featureName} 처리 결과는 성공, 실패, 취소 상태로 구분되어야 한다.`,
      `관리자는 ${featureName} 사용 현황을 확인할 수 있어야 한다.`,
    ],
    ui: [
      `${featureName} 입력 화면이 필요하다.`,
      "필수 입력값과 도움말을 명확하게 표시해야 한다.",
      "빈 상태, 로딩, 오류, 완료 상태를 제공해야 한다.",
    ],
    api: [
      { method: "GET", path: `/api/${slug}`, description: `${featureName} 목록을 조회한다.` },
      { method: "POST", path: `/api/${slug}`, description: `${featureName} 데이터를 생성한다.` },
      { method: "PATCH", path: `/api/${slug}/:id`, description: `${featureName} 데이터를 수정한다.` },
    ],
    database: [
      {
        name: `${slug.replace(/-/g, "_") || "features"}`,
        columns: [
          commonColumns.id,
          { name: "title", type: "varchar", description: "항목명" },
          { name: "status", type: "varchar", description: "처리 상태" },
          { name: "created_by", type: "uuid", key: "FK", references: "users.id" },
          commonColumns.createdAt,
          commonColumns.updatedAt,
        ],
      },
    ],
    tasks: [
      { title: `${featureName} 화면 설계`, priority: "Medium" },
      { title: `${featureName} API 구현`, priority: "High" },
      { title: `${featureName} 입력값 검증`, priority: "Medium" },
    ],
    relationships: [{ from: `${slug.replace(/-/g, "_")}.created_by`, to: "users.id", type: "N:1" }],
  };
}

function findMatchedRules(input) {
  const normalized = normalize(input);
  const matches = featureRules.filter((rule) =>
    rule.keywords.some((keyword) => normalized.includes(normalize(keyword)))
  );

  return matches.length ? matches : [createGenericRule(input)];
}

export function analyzeRequirement(input) {
  const requirements = splitRequirementInput(input);
  const matchedRules = requirements.flatMap((requirement) => findMatchedRules(requirement));
  const ruleMap = new Map(matchedRules.map((rule) => [rule.id, rule]));
  const rules = [...ruleMap.values()];
  const relationships = uniqueByText(rules.flatMap((rule) => rule.relationships || []));

  return {
    meta: {
      input,
      detectedRequirements: requirements,
      detectedDomains: rules.map((rule) => rule.label),
      summary: `${rules.map((rule) => rule.label).join(", ")} 중심의 요구사항으로 분석했습니다.`,
    },
    functional: uniqueByText(rules.flatMap((rule) => rule.functional)),
    ui: uniqueByText(rules.flatMap((rule) => rule.ui)),
    api: uniqueByText(rules.flatMap((rule) => rule.api)),
    database: mergeTables(rules.flatMap((rule) => rule.database)),
    relationships,
    tasks: uniqueByText(rules.flatMap((rule) => rule.tasks)),
  };
}

export function normalizeRequirementAnalysis(value) {
  if (!value) return null;
  if (!Array.isArray(value) && typeof value === "object" && value.functional) {
    return {
      meta: value.meta || { detectedRequirements: [], detectedDomains: [], summary: "요구사항 분석 결과입니다." },
      functional: value.functional || [],
      ui: value.ui || [],
      api: value.api || [],
      database: value.database || [],
      relationships: value.relationships || [],
      tasks: value.tasks || [],
    };
  }

  if (Array.isArray(value)) {
    const byId = Object.fromEntries(value.map((section) => [section.id, section]));
    return {
      meta: { detectedRequirements: [], detectedDomains: [], summary: "이전 구조화 결과를 분석 화면으로 변환했습니다." },
      functional: (byId.functional?.items || []).map((item) => item.text),
      ui: (byId.ui?.items || []).map((item) => item.text),
      api: (byId.api?.items || []).map((item) => ({
        method: "INFO",
        path: item.text,
        description: item.text,
      })),
      database: [],
      relationships: [],
      tasks: [],
    };
  }

  return null;
}

export function getRequirementGroupCount(value) {
  const analysis = normalizeRequirementAnalysis(value);
  if (!analysis) return 0;

  return ["functional", "ui", "api", "database", "tasks"].filter((key) => analysis[key]?.length).length;
}

export function structureRequirements(input) {
  const analysis = analyzeRequirement(input);
  const titles = {
    functional: "기능 요구사항",
    ui: "UI 요구사항",
    api: "API 요구사항",
    database: "데이터베이스 요구사항",
    tasks: "작업 분해",
  };

  return ["functional", "ui", "api", "database", "tasks"].map((key) => ({
    id: key,
    title: titles[key],
    items: analysis[key].map((item, index) => ({
      id: `${key.toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
      text: typeof item === "string" ? item : item.title || item.path || item.name,
    })),
  }));
}
