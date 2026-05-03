import { CheckCircle2, Copy, MailPlus, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button.jsx";
import { FormField, inputClassName } from "../../components/FormField.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { canUserPerformAction, getRoleLabel, roles } from "../../features/permissions/permissions.js";
import { PermissionNotice } from "../../features/team/PermissionNotice.jsx";

const inviteRoles = ["Admin", "Member", "Viewer"];

function ConfirmationModal({ open, title, description, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
      <div className="w-full max-w-sm rounded-lg border border-surface-line bg-white p-5 shadow-lg">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <ShieldAlert size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink-strong">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            취소
          </Button>
          <Button className="border-red-600 bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}

function buildInviteLink(invite) {
  const url = new URL(window.location.href);
  url.searchParams.set("invite", invite.token || invite.id);
  return url.toString();
}

function formatDate(date) {
  if (!date) return "만료일 미정";
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(date));
}

export function TeamTab({
  workspaces,
  activeWorkspace,
  onWorkspaceChange,
  onCreateWorkspace,
  team,
  invitations,
  onInviteMember,
  onAcceptInvite,
  onUpdateMemberRole,
  currentUser,
  currentRole,
}) {
  const [invite, setInvite] = useState({ email: "", role: "Member" });
  const [workspaceName, setWorkspaceName] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState("");
  const canInvite = canUserPerformAction(currentRole, "member.invite");
  const canManage = canUserPerformAction(currentRole, "member.manage");
  const canDeleteWorkspace = canUserPerformAction(currentRole, "workspace.delete");

  const inviteMember = (event) => {
    event.preventDefault();
    if (!invite.email.trim() || !canInvite) return;
    onInviteMember({ email: invite.email.trim(), role: invite.role });
    setInvite({ email: "", role: "Member" });
    setInviteFeedback("초대를 만들었습니다. 대기 목록에서 초대 링크를 복사할 수 있습니다.");
  };

  const createWorkspace = (event) => {
    event.preventDefault();
    if (!workspaceName.trim()) return;
    onCreateWorkspace(workspaceName);
    setWorkspaceName("");
  };

  const copyInviteLink = async (pendingInvite) => {
    const link = buildInviteLink(pendingInvite);
    try {
      await navigator.clipboard.writeText(link);
      setInviteFeedback(`${pendingInvite.email} 초대 링크를 복사했습니다.`);
    } catch {
      setInviteFeedback(`초대 링크: ${link}`);
    }
  };

  const currentUserEmail = currentUser?.email?.toLowerCase();

  return (
    <div className="space-y-6 p-6">
      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-lg border border-surface-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink-strong">워크스페이스</h2>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              팀 단위로 프로젝트와 멤버를 분리해서 관리합니다.
            </p>

            <div className="mt-5 space-y-3">
              <FormField label="현재 워크스페이스">
                <select
                  className={inputClassName}
                  value={activeWorkspace?.id}
                  onChange={(event) => onWorkspaceChange(event.target.value)}
                >
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <form className="space-y-3" onSubmit={createWorkspace}>
                <FormField label="새 워크스페이스">
                  <input
                    className={inputClassName}
                    value={workspaceName}
                    onChange={(event) => setWorkspaceName(event.target.value)}
                    placeholder="예: 모바일 앱 팀"
                  />
                </FormField>
                <Button type="submit" variant="secondary" disabled={!workspaceName.trim()}>
                  <Plus size={16} aria-hidden="true" />
                  워크스페이스 만들기
                </Button>
              </form>

              <Button
                className="border-red-200 text-red-700 hover:bg-red-50"
                variant="secondary"
                disabled={!canDeleteWorkspace}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 size={16} aria-hidden="true" />
                워크스페이스 삭제
              </Button>
              <PermissionNotice role={currentRole} actionLabel="워크스페이스 삭제" visible={!canDeleteWorkspace} />
            </div>
          </section>

          <section className="rounded-lg border border-surface-line bg-white p-5">
            <h2 className="text-lg font-semibold text-ink-strong">팀원 초대</h2>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              이메일로 초대를 만들고 역할을 지정합니다. 실제 이메일 발송은 백엔드 연결 후 붙일 수 있도록 링크 기반으로 준비했습니다.
            </p>

            <form className="mt-5 space-y-4" onSubmit={inviteMember}>
              <FormField label="이메일">
                <input
                  className={inputClassName}
                  type="email"
                  value={invite.email}
                  onChange={(event) => setInvite({ ...invite, email: event.target.value })}
                  placeholder="name@company.com"
                  disabled={!canInvite}
                />
              </FormField>
              <FormField label="역할">
                <select
                  className={inputClassName}
                  value={invite.role}
                  onChange={(event) => setInvite({ ...invite, role: event.target.value })}
                  disabled={!canInvite}
                >
                  {inviteRoles.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </FormField>
              <PermissionNotice role={currentRole} actionLabel="멤버 초대" visible={!canInvite} />
              <Button type="submit" variant="primary" disabled={!invite.email.trim() || !canInvite}>
                <MailPlus size={16} aria-hidden="true" />
                초대하기
              </Button>
            </form>
            {inviteFeedback ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 size={15} aria-hidden="true" />
                {inviteFeedback}
              </p>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-surface-line bg-white">
            <div className="border-b border-surface-line px-5 py-4">
              <h2 className="text-lg font-semibold text-ink-strong">멤버</h2>
              <p className="mt-1 text-sm text-ink-muted">역할에 따라 편집, 초대, 관리 권한이 달라집니다.</p>
            </div>
            <div className="divide-y divide-surface-line">
              {team.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${member.avatarColor}`}
                    >
                      {member.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-strong">{member.name}</p>
                      <p className="truncate text-sm text-ink-muted">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <select
                      className={`${inputClassName} w-28`}
                      value={member.role}
                      onChange={(event) => onUpdateMemberRole(member.id, event.target.value)}
                      disabled={!canManage || member.role === "Owner"}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {getRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                    <StatusBadge value={member.status} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-surface-line bg-white">
            <div className="border-b border-surface-line px-5 py-4">
              <h2 className="text-lg font-semibold text-ink-strong">초대 대기</h2>
            </div>
            {invitations.length ? (
              <div className="divide-y divide-surface-line">
                {invitations.map((pendingInvite) => {
                  const isPending = pendingInvite.status === "Pending";
                  const canAcceptOwnInvite =
                    isPending && currentUserEmail && pendingInvite.email.toLowerCase() === currentUserEmail;

                  return (
                    <div key={pendingInvite.id} className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-strong">{pendingInvite.email}</p>
                        <p className="text-sm text-ink-muted">
                          {getRoleLabel(pendingInvite.role)} · {formatDate(pendingInvite.expiresAt)}까지 유효
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge value={isPending ? "대기 중" : pendingInvite.status === "Accepted" ? "활성" : "만료"} />
                        {isPending ? (
                          <Button variant="secondary" onClick={() => copyInviteLink(pendingInvite)}>
                            <Copy size={15} aria-hidden="true" />
                            링크 복사
                          </Button>
                        ) : null}
                        {canAcceptOwnInvite ? (
                          <Button variant="primary" onClick={() => onAcceptInvite(pendingInvite.id)}>
                            내 초대 수락
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-ink-muted">대기 중인 초대가 없습니다.</div>
            )}
          </section>
        </div>
      </section>

      <ConfirmationModal
        open={confirmDeleteOpen}
        title="워크스페이스 삭제"
        description="삭제 API가 연결되면 워크스페이스의 프로젝트, 작업, 댓글이 함께 삭제됩니다. 지금은 위험 작업 확인 흐름만 보여줍니다."
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
