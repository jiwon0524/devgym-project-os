import { PageHeader } from "../components/PageHeader.jsx";
import { Tabs } from "../components/Tabs.jsx";
import { OverviewTab } from "./workspace/OverviewTab.jsx";
import { RequirementsTab } from "./workspace/RequirementsTab.jsx";
import { TasksTab } from "./workspace/TasksTab.jsx";
import { TeamTab } from "./workspace/TeamTab.jsx";
import { TimelineTab } from "./workspace/TimelineTab.jsx";
import { ActivityTab } from "./workspace/ActivityTab.jsx";

const tabs = [
  { id: "Overview", label: "개요" },
  { id: "Requirements", label: "요구사항" },
  { id: "Tasks", label: "작업" },
  { id: "Timeline", label: "일정" },
  { id: "Team", label: "팀" },
  { id: "Activity", label: "활동" },
];

export function ProjectWorkspace({
  activeTab,
  onTabChange,
  project,
  requirements,
  onRequirementsChange,
  requirementInput,
  onRequirementInputChange,
  tasks,
  onTasksChange,
  onCreateTask,
  onPersistTaskUpdate,
  onAddGeneratedTasks,
  workspaces,
  activeWorkspace,
  onWorkspaceChange,
  onCreateWorkspace,
  team,
  onTeamChange,
  invitations,
  onInviteMember,
  onAcceptInvite,
  onUpdateMemberRole,
  currentUser,
  currentRole,
  activities,
  onAddActivity,
}) {
  const renderTab = () => {
    switch (activeTab) {
      case "Requirements":
        return (
          <RequirementsTab
            project={project}
            requirementInput={requirementInput}
            onRequirementInputChange={onRequirementInputChange}
            requirements={requirements}
            onRequirementsChange={onRequirementsChange}
            onAddGeneratedTasks={onAddGeneratedTasks}
            currentRole={currentRole}
            currentUser={currentUser}
            onAddActivity={onAddActivity}
            onOpenTasks={() => onTabChange("Tasks")}
          />
        );
      case "Tasks":
        return (
          <TasksTab
            tasks={tasks}
            onTasksChange={onTasksChange}
            team={team}
            currentRole={currentRole}
            onAddActivity={onAddActivity}
            currentUser={currentUser}
            onCreateTask={onCreateTask}
            onPersistTaskUpdate={onPersistTaskUpdate}
          />
        );
      case "Timeline":
        return <TimelineTab />;
      case "Team":
        return (
          <TeamTab
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onWorkspaceChange={onWorkspaceChange}
            onCreateWorkspace={onCreateWorkspace}
            team={team}
            onTeamChange={onTeamChange}
            invitations={invitations}
            onInviteMember={onInviteMember}
            onAcceptInvite={onAcceptInvite}
            onUpdateMemberRole={onUpdateMemberRole}
            currentUser={currentUser}
            currentRole={currentRole}
          />
        );
      case "Activity":
        return <ActivityTab activities={activities} team={team} />;
      default:
        return <OverviewTab project={project} requirements={requirements} tasks={tasks} team={team} />;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="프로젝트 워크스페이스"
        title={project.name}
        description="하나의 프로젝트 안에서 개요, 요구사항, 작업, 일정, 팀 흐름을 순서대로 관리합니다."
      />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
      {renderTab()}
    </>
  );
}
