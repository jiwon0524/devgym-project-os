export const currentUserId = "u-owner";

export const defaultWorkspaces = [
  {
    id: "workspace-default",
    name: "새 워크스페이스",
    ownerId: currentUserId,
    createdAt: new Date().toISOString(),
  },
];

export const defaultWorkspaceMembers = [
  {
    id: "wm-owner",
    workspaceId: "workspace-default",
    userId: currentUserId,
    name: "JIWON",
    email: "owner@projectos.local",
    role: "Owner",
    status: "Active",
    online: true,
    editing: "",
    avatarColor: "bg-blue-600",
  },
];

export const defaultInvitations = [];
export const defaultComments = [];
export const defaultActivities = [];

export function createActivity(actor, action, target) {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    actor,
    action,
    target,
    timestamp: new Date().toISOString(),
  };
}

export function normalizeMember(member, workspaceId = "workspace-default") {
  return {
    workspaceId,
    userId: member.userId || member.id,
    email: member.email || `${member.name || "member"}@projectos.local`,
    online: member.online ?? member.status === "Active",
    editing: member.editing || "",
    avatarColor: member.avatarColor || "bg-slate-700",
    ...member,
  };
}
