export function OnlineMembers({ members }) {
  const onlineMembers = members.filter((member) => member.online);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-strong">온라인 멤버</h3>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
          {onlineMembers.length}명 접속
        </span>
      </div>
      <div className="flex -space-x-2">
        {onlineMembers.map((member) => (
          <div
            key={member.id}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white ${member.avatarColor}`}
            title={member.name}
          >
            {member.name.slice(0, 1)}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {onlineMembers.map((member) => (
          <div key={`${member.id}-editing`} className="rounded-lg bg-surface-muted p-2 text-xs text-ink-muted">
            <span className="font-medium text-ink-strong">{member.name}</span>
            {member.editing ? `님이 ${member.editing}을 편집 중입니다.` : "님이 온라인입니다."}
          </div>
        ))}
      </div>
    </section>
  );
}
