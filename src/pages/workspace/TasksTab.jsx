import { Plus } from "lucide-react";
import { Button } from "../../components/Button.jsx";
import { inputClassName } from "../../components/FormField.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { canUserPerformAction } from "../../features/permissions/permissions.js";
import { PermissionNotice } from "../../features/team/PermissionNotice.jsx";

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

export function TasksTab({
  tasks,
  onTasksChange,
  team,
  currentRole = "Viewer",
  onAddActivity,
  currentUser,
  onCreateTask,
  onPersistTaskUpdate,
}) {
  const canCreateTask = canUserPerformAction(currentRole, "task.create");
  const canEditTask = canUserPerformAction(currentRole, "task.edit");

  const addTask = () => {
    if (!canCreateTask) return;
    const nextTask = {
      id: `task-${Date.now()}`,
      title: "새 작업",
      status: "Todo",
      assignee: team[0]?.name || "미배정",
      priority: "Medium",
    };
    onTasksChange([...tasks, nextTask]);
    onCreateTask?.(nextTask);
    onAddActivity?.("작업을 생성했습니다", "새 작업", currentUser?.name);
  };

  const updateTask = (taskId, field, value) => {
    if (!canEditTask) return;
    const task = tasks.find((item) => item.id === taskId);
    onTasksChange(tasks.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)));
    onPersistTaskUpdate?.({ taskId, field, value });
    onAddActivity?.("작업을 수정했습니다", `${task?.title || "작업"} · ${field}`, currentUser?.name);
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink-strong">작업 목록</h2>
          <p className="mt-1 text-sm text-ink-muted">담당자, 우선순위, 진행 상태를 관리합니다.</p>
        </div>
        <Button className="shrink-0" variant="primary" onClick={addTask} disabled={!canCreateTask}>
          <Plus size={16} aria-hidden="true" />
          작업 추가
        </Button>
      </div>
      <PermissionNotice role={currentRole} actionLabel="작업 생성 또는 수정" visible={!canCreateTask || !canEditTask} />

      <div className="overflow-x-auto rounded-lg border border-surface-line bg-white">
        <table className="min-w-[760px] w-full border-collapse text-left text-sm">
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
                    disabled={!canEditTask}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    className={inputClassName}
                    value={normalizeStatus(task.status)}
                    onChange={(event) => updateTask(task.id, "status", event.target.value)}
                    disabled={!canEditTask}
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
                    disabled={!canEditTask}
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
                    disabled={!canEditTask}
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
