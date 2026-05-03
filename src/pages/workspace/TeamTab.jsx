import { MailPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/Button.jsx";
import { FormField, inputClassName } from "../../components/FormField.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";

const roles = ["프로덕트 오너", "프론트엔드 개발자", "백엔드 개발자", "디자이너", "뷰어"];
const roleLabels = {
  "Product Owner": "프로덕트 오너",
  "Frontend Engineer": "프론트엔드 개발자",
  "Backend Engineer": "백엔드 개발자",
  Designer: "디자이너",
  Viewer: "뷰어",
};

export function TeamTab({ team, onTeamChange }) {
  const [invite, setInvite] = useState({ name: "", role: "뷰어" });

  const inviteMember = (event) => {
    event.preventDefault();
    if (!invite.name.trim()) return;

    onTeamChange([
      ...team,
      {
        id: `u-${Date.now()}`,
        name: invite.name.trim(),
        role: invite.role,
        status: "Invited",
      },
    ]);
    setInvite({ name: "", role: "뷰어" });
  };

  return (
    <div className="grid gap-6 p-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section className="rounded-lg border border-surface-line bg-white p-5">
        <h2 className="text-lg font-semibold text-ink-strong">팀원 초대</h2>
        <p className="mt-1 text-sm leading-6 text-ink-muted">의사결정과 실행을 맡을 사람을 추가하세요.</p>

        <form className="mt-5 space-y-4" onSubmit={inviteMember}>
          <FormField label="이름 또는 이메일">
            <input
              className={inputClassName}
              value={invite.name}
              onChange={(event) => setInvite({ ...invite, name: event.target.value })}
              placeholder="name@company.com"
            />
          </FormField>
          <FormField label="역할">
            <select
              className={inputClassName}
              value={invite.role}
              onChange={(event) => setInvite({ ...invite, role: event.target.value })}
            >
              {roles.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </FormField>
          <Button type="submit" variant="primary" disabled={!invite.name.trim()}>
            <MailPlus size={16} aria-hidden="true" />
            초대하기
          </Button>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-surface-line bg-white">
        <div className="border-b border-surface-line px-5 py-4">
          <h2 className="text-lg font-semibold text-ink-strong">팀</h2>
        </div>
        <div className="divide-y divide-surface-line">
          {team.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-medium text-ink-strong">{member.name}</p>
                <p className="text-sm text-ink-muted">{roleLabels[member.role] || member.role}</p>
              </div>
              <StatusBadge value={member.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
