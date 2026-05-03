import { PageHeader } from "../components/PageHeader.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";

export function MyTasks({ tasks }) {
  return (
    <>
      <PageHeader
        eyebrow="내 작업"
        title="배정된 작업"
        description="현재 사용자에게 배정된 작업만 집중해서 확인합니다."
      />

      <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-surface-line bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-muted text-xs font-medium uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">작업</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">우선순위</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-line">
              {tasks.map((task) => (
                <tr key={task.id} className="transition duration-150 hover:bg-surface-muted">
                  <td className="px-4 py-3 font-medium text-ink-strong">{task.title}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={task.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={task.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
