const roleToDb = {
  Owner: "owner",
  Admin: "admin",
  Member: "member",
  Viewer: "viewer",
};

const roleFromDb = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const taskStatusToDb = {
  Todo: "todo",
  "In Progress": "in_progress",
  Done: "done",
  "할 일": "todo",
  "진행 중": "in_progress",
  완료: "done",
};

const taskStatusFromDb = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const priorityToDb = {
  High: "high",
  Medium: "medium",
  Low: "low",
  높음: "high",
  보통: "medium",
  낮음: "low",
};

const priorityFromDb = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const projectStatusToDb = {
  Active: "active",
  Paused: "paused",
  Done: "done",
  active: "active",
  paused: "paused",
  done: "done",
};

const avatarColors = ["bg-blue-600", "bg-emerald-600", "bg-slate-700", "bg-amber-600", "bg-violet-600"];

export function toDbRole(role) {
  return roleToDb[role] || String(role || "viewer").toLowerCase();
}

export function fromDbRole(role) {
  return roleFromDb[role] || role || "Viewer";
}

export function toDbTaskStatus(status) {
  return taskStatusToDb[status] || "todo";
}

export function fromDbTaskStatus(status) {
  return taskStatusFromDb[status] || status || "Todo";
}

export function toDbPriority(priority) {
  return priorityToDb[priority] || "medium";
}

export function fromDbPriority(priority) {
  return priorityFromDb[priority] || priority || "Medium";
}

export function toDbProjectStatus(status) {
  return projectStatusToDb[status] || "active";
}

export function getAvatarColor(seed = "") {
  const total = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[total % avatarColors.length];
}

export function mapProfile(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.id,
    email: row.email,
    name: row.display_name || row.email?.split("@")[0] || "사용자",
    displayName: row.display_name || row.email?.split("@")[0] || "사용자",
    avatarUrl: row.avatar_url,
    avatarColor: getAvatarColor(row.id || row.email),
    createdAt: row.created_at,
  };
}

export function mapWorkspace(row) {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    createdAt: row.created_at,
  };
}

export function mapWorkspaceMember(row) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const email = profile?.email || row.email || "";
  const name = profile?.display_name || email.split("@")[0] || "팀원";

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    name,
    email,
    role: fromDbRole(row.role),
    status: "Active",
    online: false,
    editing: "",
    avatarColor: getAvatarColor(row.user_id || email),
    createdAt: row.created_at,
  };
}

export function mapProject(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description || "",
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function mapRequirementRecord(row) {
  if (!row) return null;
  const acceptanceRows = Array.isArray(row.acceptance_criteria) ? row.acceptance_criteria : [];
  const riskRows = Array.isArray(row.risks) ? row.risks : [];
  const testRows = Array.isArray(row.test_cases) ? row.test_cases : [];

  return {
    id: row.id,
    summary: row.summary || `${row.title} 요구사항 분석 결과입니다.`,
    functionalRequirements: row.functional || [],
    nonFunctionalRequirements: row.non_functional || [],
    uiRequirements: row.ui || [],
    apiDesign: row.api || [],
    databaseSchema: row.database_schema || [],
    erdRelations: row.erd_relations || [],
    tasks: row.generated_tasks || [],
    risks: riskRows.map((risk) =>
      typeof risk === "string" ? { content: risk, severity: "medium" } : { content: risk.content, severity: risk.severity }
    ),
    acceptanceCriteria: acceptanceRows.map((criteria) =>
      typeof criteria === "string" ? criteria : criteria.content
    ),
    testCases: testRows.map((testCase) => ({
      title: testCase.title,
      given: testCase.given || testCase.given_text,
      when: testCase.when || testCase.when_text,
      then: testCase.then || testCase.then_text,
    })),
    meta: {
      input: row.original_input,
      detectedRequirements: [row.title],
      detectedDomains: [],
      summary: row.summary || `${row.title} 요구사항 분석 결과입니다.`,
      savedAt: row.created_at,
    },
    functional: row.functional || [],
    ui: row.ui || [],
    api: row.api || [],
    database: row.database_schema || [],
    relationships: row.relationships || [],
    tasks: row.generated_tasks || [],
  };
}

export function mapTask(row) {
  const assignee = Array.isArray(row.assignee) ? row.assignee[0] : row.assignee;

  return {
    id: row.id,
    projectId: row.project_id,
    requirementId: row.requirement_id,
    title: row.title,
    description: row.description || "",
    status: fromDbTaskStatus(row.status),
    priority: fromDbPriority(row.priority),
    assigneeId: row.assignee_id,
    assignee: assignee?.display_name || assignee?.email?.split("@")[0] || "미배정",
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function mapComment(row) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    id: row.id,
    projectId: row.project_id,
    targetType: row.target_type,
    targetId: row.target_id,
    authorId: row.created_by,
    authorName: profile?.display_name || profile?.email?.split("@")[0] || "사용자",
    body: row.body,
    createdAt: row.created_at,
    updatedAt: null,
  };
}

export function mapActivity(row) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const targetLabel = row.target_type ? `${row.target_type}${row.target_id ? ` · ${String(row.target_id).slice(0, 8)}` : ""}` : "프로젝트";

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    actorId: row.actor_id,
    actor: profile?.display_name || profile?.email?.split("@")[0] || "시스템",
    action: row.action,
    target: targetLabel,
    timestamp: row.created_at,
  };
}

export function mapInvitation(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    email: row.email,
    role: fromDbRole(row.role),
    status: row.status === "pending" ? "Pending" : row.status === "accepted" ? "Accepted" : "Expired",
    invitedBy: row.invited_by,
    createdAt: row.created_at,
  };
}
