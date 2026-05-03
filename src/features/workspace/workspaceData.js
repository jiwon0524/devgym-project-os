export const currentUserId = "u-1";

export const defaultWorkspaces = [
  {
    id: "workspace-devgym",
    name: "DevGym 팀 워크스페이스",
    ownerId: currentUserId,
    createdAt: "2026-05-03T09:00:00.000Z",
  },
  {
    id: "workspace-lab",
    name: "실험실 워크스페이스",
    ownerId: "u-2",
    createdAt: "2026-05-03T10:00:00.000Z",
  },
];

export const defaultWorkspaceMembers = [
  {
    id: "wm-1",
    workspaceId: "workspace-devgym",
    userId: "u-1",
    name: "지원",
    email: "jiwon@devgym.dev",
    role: "Owner",
    status: "Active",
    online: true,
    editing: "요구사항 분석",
    avatarColor: "bg-blue-600",
  },
  {
    id: "wm-2",
    workspaceId: "workspace-devgym",
    userId: "u-2",
    name: "민지",
    email: "minji@devgym.dev",
    role: "Admin",
    status: "Active",
    online: true,
    editing: "작업 상태",
    avatarColor: "bg-emerald-600",
  },
  {
    id: "wm-3",
    workspaceId: "workspace-devgym",
    userId: "u-3",
    name: "도윤",
    email: "doyun@devgym.dev",
    role: "Member",
    status: "Active",
    online: false,
    editing: "",
    avatarColor: "bg-slate-700",
  },
  {
    id: "wm-4",
    workspaceId: "workspace-devgym",
    userId: "u-4",
    name: "소라",
    email: "sora@devgym.dev",
    role: "Viewer",
    status: "Invited",
    online: false,
    editing: "",
    avatarColor: "bg-amber-600",
  },
  {
    id: "wm-5",
    workspaceId: "workspace-lab",
    userId: "u-1",
    name: "지원",
    email: "jiwon@devgym.dev",
    role: "Admin",
    status: "Active",
    online: true,
    editing: "프로젝트 개요",
    avatarColor: "bg-blue-600",
  },
];

export const defaultInvitations = [
  {
    id: "invite-1",
    workspaceId: "workspace-devgym",
    email: "new.member@company.com",
    role: "Member",
    status: "Pending",
    invitedBy: "지원",
    createdAt: "2026-05-03T11:30:00.000Z",
  },
];

export const defaultComments = [
  {
    id: "comment-1",
    targetType: "project",
    targetId: "overview",
    authorId: "u-2",
    authorName: "민지",
    body: "요구사항 분석 결과에서 API 범위를 먼저 잠그면 작업 분배가 쉬울 것 같아요.",
    createdAt: "2026-05-03T11:48:00.000Z",
    updatedAt: null,
  },
  {
    id: "comment-2",
    targetType: "requirements",
    targetId: "analysis",
    authorId: "u-1",
    authorName: "지원",
    body: "로그인 기능은 세션 만료와 실패 횟수 제한까지 포함해서 보겠습니다.",
    createdAt: "2026-05-03T11:52:00.000Z",
    updatedAt: null,
  },
];

export const defaultActivities = [
  {
    id: "activity-1",
    actor: "지원",
    action: "프로젝트를 생성했습니다",
    target: "DevGym ProjectOS",
    timestamp: "2026-05-03T11:40:00.000Z",
  },
  {
    id: "activity-2",
    actor: "민지",
    action: "작업 상태를 변경했습니다",
    target: "인증 API 구현 → 진행 중",
    timestamp: "2026-05-03T11:46:00.000Z",
  },
  {
    id: "activity-3",
    actor: "지원",
    action: "멤버를 초대했습니다",
    target: "new.member@company.com",
    timestamp: "2026-05-03T11:50:00.000Z",
  },
];

export function createActivity(actor, action, target) {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    actor,
    action,
    target,
    timestamp: new Date().toISOString(),
  };
}

export function normalizeMember(member, workspaceId = "workspace-devgym") {
  return {
    workspaceId,
    userId: member.userId || member.id,
    email: member.email || `${member.name || "member"}@devgym.dev`,
    online: member.online ?? member.status === "Active",
    editing: member.editing || "",
    avatarColor: member.avatarColor || "bg-slate-700",
    ...member,
  };
}
