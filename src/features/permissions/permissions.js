export const roles = ["Owner", "Admin", "Member", "Viewer"];

export const roleLabels = {
  Owner: "소유자",
  Admin: "관리자",
  Member: "멤버",
  Viewer: "뷰어",
  "Product Owner": "소유자",
  "Frontend Engineer": "멤버",
  "Backend Engineer": "멤버",
  Designer: "멤버",
  "프로덕트 오너": "소유자",
  "프론트엔드 개발자": "멤버",
  "백엔드 개발자": "멤버",
  디자이너: "멤버",
  뷰어: "뷰어",
};

const roleAliases = {
  "Product Owner": "Owner",
  "Frontend Engineer": "Member",
  "Backend Engineer": "Member",
  Designer: "Member",
  Viewer: "Viewer",
  "프로덕트 오너": "Owner",
  "프론트엔드 개발자": "Member",
  "백엔드 개발자": "Member",
  디자이너: "Member",
  뷰어: "Viewer",
};

const permissionMatrix = {
  Owner: [
    "workspace.delete",
    "workspace.switch",
    "project.manage",
    "member.invite",
    "member.manage",
    "requirement.edit",
    "artifact.save",
    "task.create",
    "task.edit",
    "task.delete",
    "comment.create",
    "comment.edit.own",
    "comment.delete.own",
    "activity.view",
  ],
  Admin: [
    "workspace.switch",
    "project.manage",
    "member.invite",
    "member.manage",
    "requirement.edit",
    "artifact.save",
    "task.create",
    "task.edit",
    "task.delete",
    "comment.create",
    "comment.edit.own",
    "comment.delete.own",
    "activity.view",
  ],
  Member: [
    "workspace.switch",
    "requirement.edit",
    "artifact.save",
    "task.create",
    "task.edit",
    "comment.create",
    "comment.edit.own",
    "comment.delete.own",
    "activity.view",
  ],
  Viewer: ["workspace.switch", "comment.create", "activity.view"],
};

export function normalizeRole(role) {
  return roleAliases[role] || (roles.includes(role) ? role : "Viewer");
}

export function getRoleLabel(role) {
  return roleLabels[role] || roleLabels[normalizeRole(role)] || "뷰어";
}

export function canUserPerformAction(userRole, action) {
  const normalizedRole = normalizeRole(userRole);
  return permissionMatrix[normalizedRole]?.includes(action) || false;
}

export function getPermissionWarning(userRole, actionLabel) {
  return `${getRoleLabel(userRole)} 권한에서는 ${actionLabel}을 수행할 수 없습니다.`;
}
