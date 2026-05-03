import { EmptyState } from "./components/EmptyState.jsx";
import { PageHeader } from "./components/PageHeader.jsx";
import { defaultTasks, defaultTeam } from "./data/seedData.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { AppLayout } from "./layout/AppLayout.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { MyTasks } from "./pages/MyTasks.jsx";
import { Projects } from "./pages/Projects.jsx";
import { ProjectWorkspace } from "./pages/ProjectWorkspace.jsx";

const emptyDraft = {
  name: "",
  description: "",
};

const tabByNav = {
  requirements: "Requirements",
  team: "Team",
};

export default function App() {
  const [activeNav, setActiveNav] = useLocalStorage("projectos.activeNav", "dashboard");
  const [activeTab, setActiveTab] = useLocalStorage("projectos.activeTab", "Overview");
  const [project, setProject] = useLocalStorage("projectos.project", null);
  const [draft, setDraft] = useLocalStorage("projectos.projectDraft", emptyDraft);
  const [requirementInput, setRequirementInput] = useLocalStorage(
    "projectos.requirementInput",
    "로그인 기능 만들기"
  );
  const [requirements, setRequirements] = useLocalStorage("projectos.requirements", []);
  const [tasks, setTasks] = useLocalStorage("projectos.tasks", []);
  const [team, setTeam] = useLocalStorage("projectos.team", []);

  const addGeneratedTasks = (generatedTasks) => {
    const existingTitles = new Set(tasks.map((task) => task.title.trim().toLowerCase()));
    const owner = team[0]?.name || "미배정";
    const nextTasks = generatedTasks
      .filter((task) => !existingTitles.has(task.title.trim().toLowerCase()))
      .map((task, index) => ({
        id: `ai-task-${Date.now()}-${index}`,
        title: task.title,
        status: "Todo",
        assignee: owner,
        priority: task.priority || "Medium",
        source: "AI 요구사항 분석",
      }));

    if (nextTasks.length) {
      setTasks([...tasks, ...nextTasks]);
    }

    return nextTasks.length;
  };

  const navigate = (navId) => {
    setActiveNav(navId);
    if (tabByNav[navId]) {
      setActiveTab(tabByNav[navId]);
    }
  };

  const openProjects = () => {
    setActiveNav("projects");
    if (project) setActiveTab("Overview");
  };

  const createProject = (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return;

    setProject({
      id: `project-${Date.now()}`,
      name,
      description:
        draft.description.trim() ||
        "요구사항, 작업, 일정, 협업을 한곳에서 관리하는 프로젝트 워크스페이스입니다.",
      createdAt: new Date().toISOString(),
    });
    setDraft(emptyDraft);
    setTasks((currentTasks) => (currentTasks.length ? currentTasks : defaultTasks));
    setTeam((currentTeam) => (currentTeam.length ? currentTeam : defaultTeam));
    setActiveNav("projects");
    setActiveTab("Overview");
  };

  const renderSetupRequired = (title) => (
    <>
      <PageHeader
        eyebrow="설정 필요"
        title={title}
        description="요구사항, 작업, 일정, 팀 정보를 연결하려면 프로젝트를 먼저 만들어야 합니다."
      />
      <div className="p-6">
        <EmptyState
          title="프로젝트 생성부터 시작하세요"
          description="이 앱은 화면 모음이 아니라 하나의 흐름으로 설계되어 있습니다. 프로젝트를 만든 뒤 워크스페이스로 들어가세요."
          actionLabel="프로젝트 만들기"
          onAction={openProjects}
        />
      </div>
    </>
  );

  const renderWorkspace = () => (
    <ProjectWorkspace
      activeTab={activeTab}
      onTabChange={setActiveTab}
      project={project}
      requirements={requirements}
      onRequirementsChange={setRequirements}
      requirementInput={requirementInput}
      onRequirementInputChange={setRequirementInput}
      tasks={tasks}
      onTasksChange={setTasks}
      onAddGeneratedTasks={addGeneratedTasks}
      team={team}
      onTeamChange={setTeam}
    />
  );

  const renderContent = () => {
    if (activeNav === "dashboard") {
      return (
        <Dashboard
          project={project}
          tasks={tasks}
          requirements={requirements}
          team={team}
          onStart={openProjects}
        />
      );
    }

    if (activeNav === "projects") {
      if (project) return renderWorkspace();

      return (
        <Projects
          project={project}
          draft={draft}
          onDraftChange={setDraft}
          onCreate={createProject}
          onOpenWorkspace={openProjects}
        />
      );
    }

    if (activeNav === "my-tasks") {
      if (!project) return renderSetupRequired("배정된 작업");
      return <MyTasks tasks={tasks} />;
    }

    if (activeNav === "requirements") {
      if (!project) return renderSetupRequired("요구사항");
      return renderWorkspace();
    }

    if (activeNav === "team") {
      if (!project) return renderSetupRequired("팀");
      return renderWorkspace();
    }

    return null;
  };

  return (
    <AppLayout
      activeNav={activeNav}
      onNavigate={navigate}
      project={project}
      tasks={tasks}
      team={team}
    >
      {renderContent()}
    </AppLayout>
  );
}
