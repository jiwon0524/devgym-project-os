import { Plus } from "lucide-react";
import { Button } from "../../components/Button.jsx";
import { inputClassName } from "../../components/FormField.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";

const statuses = ["Todo", "In Progress", "Done"];
const priorities = ["High", "Medium", "Low"];
const statusLabels = {
  Todo: "할 일",
  "In Progress": "진행 중",
  Done: "완료",
};
const priorityLabels = {
  High: "높음",
  Medium: "보통",
  Low: "낮음",
};
const normalizeStatus = (status) =>
  ({ "할 일": "Todo", "진행 중": "In Progress", 완료: "Done" })[status] || status;
const normalizePriority = (priority) =>
  ({ 높음: "High", 보통: "Medium", 낮음: "Low" })[priority] || priority;

export function TasksTab({ tasks, onTasksChange, team }) {
  const addTask = () => {
    onTasksChange([
      ...tasks,
      {
        id: `task-${Date.now()}`,
        title: "새 작업",
        status: "Todo",
        assignee: team[0]?.name || "미배정",
        priority: "Medium",
      },
    ]);
  };

  const updateTask = (taskId, field, value) => {
    onTasksChange(tasks.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)));
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-strong">작업 목록</h2>
          <p className="mt-1 text-sm text-ink-muted">담당자, 우선순위, 진행 상태를 관리합니다.</p>
        </div>
        <Button variant="primary" onClick={addTask}>
          <Plus size={16} aria-hidden="true" />
          작업 추가
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-surface-line bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-surface-muted text-xs font-medium uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">작업</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">담당자</th>
              <th className="px-4 py-3">우선순위</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-line">
            {tasks.map((task) => (
              <tr key={task.id} className="transition duration-150 hover:bg-surface-muted">
                <td className="min-w-[260px] px-4 py-3">
                  <input
                    className={inputClassName}
                    aria-label={`${task.title} 작업명`}
                    value={task.title}
                    onChange={(event) => updateTask(task.id, "title", event.target.value)}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    className={inputClassName}
                    value={normalizeStatus(task.status)}
                    onChange={(event) => updateTask(task.id, "status", event.target.value)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    className={inputClassName}
                    value={task.assignee}
                    onChange={(event) => updateTask(task.id, "assignee", event.target.value)}
                  >
                    {team.map((member) => (
                      <option key={member.id}>{member.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    className={inputClassName}
                    value={normalizePriority(task.priority)}
                    onChange={(event) => updateTask(task.id, "priority", event.target.value)}
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priorityLabels[priority]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <StatusBadge key={status} value={status} />
        ))}
      </div>
    </div>
  );
}
