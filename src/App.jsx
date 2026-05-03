import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "./components/EmptyState.jsx";
import { PageHeader } from "./components/PageHeader.jsx";
import { defaultTasks } from "./data/seedData.js";
import { canUserPerformAction } from "./features/permissions/permissions.js";
import { createActivity, currentUserId, defaultActivities, defaultComments, defaultInvitations, defaultWorkspaceMembers, defaultWorkspaces, normalizeMember } from "./features/workspace/workspaceData.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { AppLayout } from "./layout/AppLayout.jsx";
import { getBackendMode } from "./lib/supabaseClient.js";
import { Dashboard } from "./pages/Dashboard.jsx";
import { MyTasks } from "./pages/MyTasks.jsx";
import { Projects } from "./pages/Projects.jsx";
import { ProjectWorkspace } from "./pages/ProjectWorkspace.jsx";
import { createActivityLog, getActivityLogs } from "./services/activityService.js";
import { getCurrentProfile, login, logout, signUp } from "./services/authService.js";
import { createComment as persistComment, deleteComment as removePersistedComment, getComments, updateComment as persistCommentUpdate } from "./services/commentService.js";
import { createProject as persistProject, getProjects } from "./services/projectService.js";
import { createRequirement as persistRequirement, getRequirements } from "./services/requirementService.js";
import { subscribeToProjectRealtime } from "./services/realtimeService.js";
import { createTask as persistTask, createTasksFromRequirement, getTasks, updateTask as persistTaskUpdate } from "./services/taskService.js";
import {
  acceptInvitation as persistAcceptInvitation,
  createWorkspace as persistWorkspace,
  getInvitations,
  getWorkspaceMembers,
  getWorkspaces,
  inviteMember as persistInvitation,
  updateMemberRole as persistMemberRole,
} from "./services/workspaceService.js";

const emptyDraft = {
  name: "",
  description: "",
};

const tabByNav = {
  requirements: "Requirements",
  team: "Team",
};

const priorityLabelByValue = {
  high: "High",
  medium: "Medium",
  low: "Low",
  High: "High",
  Medium: "Medium",
  Low: "Low",
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
  const [workspaces, setWorkspaces] = useLocalStorage("projectos.workspaces", defaultWorkspaces);
  const [activeWorkspaceId, setActiveWorkspaceId] = useLocalStorage(
    "projectos.activeWorkspaceId",
    defaultWorkspaces[0].id
  );
  const [team, setTeam] = useLocalStorage("projectos.team", defaultWorkspaceMembers);
  const [invitations, setInvitations] = useLocalStorage("projectos.invitations", defaultInvitations);
  const [comments, setComments] = useLocalStorage("projectos.comments", defaultComments);
  const [activities, setActivities] = useLocalStorage("projectos.activities", defaultActivities);
  const [backendMode, setBackendMode] = useState(getBackendMode());
  const [backendLoading, setBackendLoading] = useState(true);
  const [backendError, setBackendError] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState(backendMode === "supabase" ? "준비 중" : "mock");
  const [presenceMembers, setPresenceMembers] = useState([]);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) || workspaces[0];
  const workspaceMembers = team
    .map((member) => normalizeMember(member, activeWorkspace?.id))
    .filter((member) => member.workspaceId === activeWorkspace?.id);
  const rightPanelTeam = presenceMembers.length
    ? [
        ...workspaceMembers.map((member) => {
          const presence = presenceMembers.find(
            (item) => item.userId === member.userId || item.email === member.email
          );
          return presence ? { ...member, ...presence, id: member.id } : { ...member, online: false, editing: "" };
        }),
        ...presenceMembers.filter(
          (presence) =>
            !workspaceMembers.some((member) => member.userId === presence.userId || member.email === presence.email)
        ),
      ]
    : workspaceMembers;
  const currentUser =
    workspaceMembers.find((member) => member.userId === authUser?.id) ||
    workspaceMembers.find((member) => member.userId === currentUserId) ||
    workspaceMembers[0] ||
    (authUser
      ? {
          id: authUser.id,
          userId: authUser.id,
          name: authUser.name || authUser.displayName || authUser.email,
          email: authUser.email,
          role: backendMode === "mock" ? "Owner" : "Viewer",
          status: "Active",
          online: true,
          avatarColor: "bg-blue-600",
        }
      : null);
  const currentRole = currentUser?.role || (backendMode === "mock" ? "Owner" : "Viewer");

  const reportBackendError = useCallback((error) => {
    const message = error?.message || "알 수 없는 데이터 오류가 발생했습니다.";
    setBackendError(message);
  }, []);

  const replaceWorkspaceItems = useCallback((items, workspaceId, nextItems) => {
    return [...items.filter((item) => item.workspaceId !== workspaceId), ...nextItems];
  }, []);

  const refreshProjectData = useCallback(
    async (workspaceId, nextProject) => {
      if (!workspaceId || !nextProject?.id) return;

      const [requirementRows, taskRows, commentRows, activityRows] = await Promise.all([
        getRequirements(nextProject.id),
        getTasks(nextProject.id),
        getComments(nextProject.id),
        getActivityLogs({ workspaceId, projectId: nextProject.id }),
      ]);

      if (requirementRows.length) setRequirements(requirementRows[0]);
      if (taskRows.length || backendMode === "supabase") setTasks(taskRows);
      if (commentRows.length || backendMode === "supabase") setComments(commentRows);
      if (activityRows.length || backendMode === "supabase") setActivities(activityRows);
    },
    [backendMode, setActivities, setComments, setRequirements, setTasks]
  );

  const refreshWorkspaceData = useCallback(
    async (workspaceId, preferredProjectId = project?.id) => {
      if (!workspaceId) return;

      setBackendLoading(true);
      try {
        const [memberRows, invitationRows, projectRows] = await Promise.all([
          getWorkspaceMembers(workspaceId),
          getInvitations(workspaceId),
          getProjects(workspaceId),
        ]);

        if (memberRows.length || backendMode === "supabase") {
          setTeam((current) => replaceWorkspaceItems(current, workspaceId, memberRows));
        }
        if (invitationRows.length || backendMode === "supabase") {
          setInvitations((current) => replaceWorkspaceItems(current, workspaceId, invitationRows));
        }

        const nextProject =
          projectRows.find((item) => item.id === preferredProjectId) ||
          projectRows[0] ||
          (backendMode === "mock" ? project : null);

        if (nextProject) {
          setProject(nextProject);
          await refreshProjectData(workspaceId, nextProject);
        } else if (backendMode === "supabase") {
          setProject(null);
          setRequirements([]);
          setTasks([]);
          setComments([]);
        }

        setBackendError("");
      } catch (error) {
        reportBackendError(error);
      } finally {
        setBackendLoading(false);
      }
    },
    [
      backendMode,
      project,
      refreshProjectData,
      replaceWorkspaceItems,
      reportBackendError,
      setComments,
      setInvitations,
      setProject,
      setRequirements,
      setTasks,
      setTeam,
    ]
  );

  useEffect(() => {
    let ignore = false;

    async function bootBackend() {
      setBackendLoading(true);
      try {
        setBackendMode(getBackendMode());
        const profile = await getCurrentProfile();
        if (!ignore) setAuthUser(profile);

        const workspaceRows = await getWorkspaces();
        if (!ignore && workspaceRows.length) {
          setWorkspaces(workspaceRows);
          const selectedWorkspace = workspaceRows.find((workspace) => workspace.id === activeWorkspaceId) || workspaceRows[0];
          setActiveWorkspaceId(selectedWorkspace.id);
          await refreshWorkspaceData(selectedWorkspace.id, project?.id);
        }

        if (!ignore) setBackendError("");
      } catch (error) {
        if (!ignore) reportBackendError(error);
      } finally {
        if (!ignore) setBackendLoading(false);
      }
    }

    bootBackend();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    refreshWorkspaceData(activeWorkspaceId, project?.id);
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (backendMode !== "supabase") {
      setRealtimeStatus("mock");
      setPresenceMembers((current) => (current.length ? [] : current));
      return () => {};
    }

    if (!activeWorkspace?.id || !project?.id) {
      setRealtimeStatus(backendMode === "supabase" ? "대기 중" : "mock");
      setPresenceMembers((current) => (current.length ? [] : current));
      return () => {};
    }

    return subscribeToProjectRealtime({
      workspaceId: activeWorkspace.id,
      projectId: project.id,
      currentUser,
      activeView: activeTab || activeNav,
      onStatusChange: setRealtimeStatus,
      onPresenceChange: setPresenceMembers,
      onChange: () => refreshWorkspaceData(activeWorkspace.id, project.id),
    });
  }, [
    activeTab,
    activeNav,
    activeWorkspace?.id,
    backendMode,
    currentUser?.avatarColor,
    currentUser?.email,
    currentUser?.name,
    currentUser?.role,
    currentUser?.userId,
    project?.id,
    refreshWorkspaceData,
  ]);

  const addActivity = (action, target, actor = currentUser?.name || "시스템", options = {}) => {
    const activity = createActivity(actor, action, target);
    setActivities([activity, ...activities].slice(0, 40));
    if (activeWorkspace?.id && options.persist !== false) {
      createActivityLog({
        workspaceId: activeWorkspace.id,
        projectId: project?.id,
        actorId: authUser?.id || currentUser?.userId || currentUserId,
        actorName: actor,
        action,
        targetType: project ? "project" : "workspace",
        targetId: project?.id,
        targetLabel: target,
      }).catch(reportBackendError);
    }
  };

  const addGeneratedTasks = (generatedTasks) => {
    if (!canUserPerformAction(currentRole, "task.create")) return 0;
    const existingTitles = new Set(tasks.map((task) => task.title.trim().toLowerCase()));
    const owner = currentUser?.name || "미배정";
    const nextTasks = generatedTasks
      .filter((task) => !existingTitles.has(task.title.trim().toLowerCase()))
      .map((task, index) => ({
        id: `ai-task-${Date.now()}-${index}`,
        title: task.title,
        status: "Todo",
        assignee: owner,
        priority: priorityLabelByValue[task.priority] || "Medium",
        description: task.description || "AI 요구사항 분석에서 생성된 작업입니다.",
        source: "AI 요구사항 분석",
      }));

    if (nextTasks.length) {
      setTasks([...tasks, ...nextTasks]);
      addActivity("AI 생성 작업을 추가했습니다", `${nextTasks.length}개 작업`);
      if (project?.id) {
        createTasksFromRequirement({
          projectId: project.id,
          requirementId: requirements?.id,
          tasks: nextTasks,
          createdBy: authUser?.id || currentUser?.userId || currentUserId,
        }).catch(reportBackendError);
      }
    }

    return nextTasks.length;
  };

  const createWorkspace = async (name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      const { workspace, ownerMember } = await persistWorkspace({
        name: trimmedName,
        ownerId: authUser?.id || currentUser?.userId || currentUserId,
      });

      setWorkspaces([...workspaces, workspace]);
      setTeam([...team, ownerMember]);
      setActiveWorkspaceId(workspace.id);
      setActivities([createActivity(currentUser?.name || "지원", "워크스페이스를 생성했습니다", trimmedName), ...activities]);
    } catch (error) {
      reportBackendError(error);
    }
  };

  const inviteMember = async ({ email, role }) => {
    try {
      const invite = await persistInvitation({
        workspaceId: activeWorkspace.id,
        email,
        role,
        invitedBy: authUser?.id || currentUser?.userId || currentUserId,
      });
      setInvitations([invite, ...invitations]);
      addActivity("멤버를 초대했습니다", `${email} · ${role}`);
    } catch (error) {
      reportBackendError(error);
    }
  };

  const acceptInvite = async (inviteId) => {
    const invite = invitations.find((item) => item.id === inviteId);
    if (!invite) return;
    const name = invite.email.split("@")[0];
    try {
      await persistAcceptInvitation({
        inviteId,
        userId: authUser?.id || currentUser?.userId || currentUserId,
        userEmail: authUser?.email || currentUser?.email,
      });
      setInvitations(
        invitations.map((item) => (item.id === inviteId ? { ...item, status: "Accepted" } : item))
      );
      setTeam([
        ...team,
        {
          id: `wm-${Date.now()}`,
          workspaceId: invite.workspaceId,
          userId: authUser?.id || currentUser?.userId || currentUserId,
          name,
          email: invite.email,
          role: invite.role,
          status: "Active",
          online: false,
          editing: "",
          avatarColor: "bg-slate-700",
        },
      ]);
      addActivity("초대를 수락했습니다", invite.email, name);
    } catch (error) {
      reportBackendError(error);
    }
  };

  const updateMemberRole = async (memberId, role) => {
    const member = team.find((item) => item.id === memberId);
    setTeam(team.map((item) => (item.id === memberId ? { ...item, role } : item)));
    addActivity("멤버 역할을 변경했습니다", `${member?.name || "멤버"} → ${role}`);
    try {
      await persistMemberRole({ memberId, role });
    } catch (error) {
      reportBackendError(error);
    }
  };

  const addComment = (body, targetType = activeTab.toLowerCase(), targetId = project?.id || "project") => {
    const comment = {
      id: `comment-${Date.now()}`,
      projectId: project?.id,
      targetType,
      targetId,
      authorId: currentUser?.userId || currentUserId,
      authorName: currentUser?.name || "지원",
      body,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    setComments([comment, ...comments]);
    addActivity("댓글을 남겼습니다", body.slice(0, 40));
    if (project?.id) {
      const dbTargetType = targetType.includes("requirement")
        ? "requirement"
        : targetType.includes("task")
          ? "task"
          : "project";
      persistComment({
        projectId: project.id,
        targetType: dbTargetType,
        targetId: project.id,
        body,
        createdBy: authUser?.id || currentUser?.userId || currentUserId,
        authorName: currentUser?.name || "지원",
      }).catch(reportBackendError);
    }
  };

  const editComment = (commentId, body) => {
    setComments(
      comments.map((comment) =>
        comment.id === commentId ? { ...comment, body, updatedAt: new Date().toISOString() } : comment
      )
    );
    addActivity("댓글을 수정했습니다", body.slice(0, 40));
    persistCommentUpdate({ commentId, body }).catch(reportBackendError);
  };

  const deleteComment = (commentId) => {
    const shouldDelete = window.confirm("이 댓글을 삭제할까요?");
    if (!shouldDelete) return;
    setComments(comments.filter((comment) => comment.id !== commentId));
    addActivity("댓글을 삭제했습니다", "댓글");
    removePersistedComment(commentId).catch(reportBackendError);
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

  const createProject = async (event) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return;

    try {
      const createdProject = await persistProject({
        workspaceId: activeWorkspace?.id,
        name,
        description:
          draft.description.trim() ||
          "요구사항, 작업, 일정, 협업을 한곳에서 관리하는 프로젝트 워크스페이스입니다.",
        status: "active",
        createdBy: authUser?.id || currentUser?.userId || currentUserId,
      });

      setProject(createdProject);
      setDraft(emptyDraft);
      setTasks((currentTasks) => (currentTasks.length ? currentTasks : defaultTasks));
      setTeam((currentTeam) => (currentTeam.length ? currentTeam : defaultWorkspaceMembers));
      addActivity("프로젝트를 생성했습니다", name);
      setActiveNav("projects");
      setActiveTab("Overview");
    } catch (error) {
      reportBackendError(error);
    }
  };

  const saveRequirementAnalysis = async (analysis) => {
    setRequirements(analysis);
    if (!project?.id) return;

    try {
      const savedRequirement = await persistRequirement({
        projectId: project.id,
        input: analysis.meta?.input || requirementInput,
        analysis,
        createdBy: authUser?.id || currentUser?.userId || currentUserId,
      });

      const analysisWithId = {
        ...analysis,
        id: savedRequirement.id,
        meta: {
          ...analysis.meta,
          savedAt: savedRequirement.createdAt || savedRequirement.meta?.savedAt || new Date().toISOString(),
        },
      };
      setRequirements(analysisWithId);

      const existingTitles = new Set(tasks.map((task) => task.title.trim().toLowerCase()));
      const savedTasks = (savedRequirement.savedTasks || []).filter(
        (task) => !existingTitles.has(task.title.trim().toLowerCase())
      );

      if (savedTasks.length) {
        setTasks([...tasks, ...savedTasks]);
      }

      addActivity("요구사항을 분석하고 저장했습니다", analysis.meta?.summary || "AI 분석 결과", undefined, {
        persist: false,
      });
    } catch (error) {
      reportBackendError(error);
    }
  };

  const handleLogin = async (credentials) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await login(credentials);
      const profile = await getCurrentProfile();
      setAuthUser(profile);
      await refreshWorkspaceData(activeWorkspace?.id, project?.id);
    } catch (error) {
      setAuthError(error?.message || "로그인에 실패했습니다.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (credentials) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await signUp(credentials);
      const profile = await getCurrentProfile();
      setAuthUser(profile);
      await refreshWorkspaceData(activeWorkspace?.id, project?.id);
    } catch (error) {
      setAuthError(error?.message || "회원가입에 실패했습니다.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await logout();
      setAuthUser(null);
    } catch (error) {
      setAuthError(error?.message || "로그아웃에 실패했습니다.");
    } finally {
      setAuthLoading(false);
    }
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
      onRequirementsChange={saveRequirementAnalysis}
      requirementInput={requirementInput}
      onRequirementInputChange={setRequirementInput}
      tasks={tasks}
      onTasksChange={setTasks}
      onCreateTask={(task) => {
        if (!project?.id) return;
        persistTask({
          projectId: project.id,
          title: task.title,
          description: task.description || "",
          status: task.status,
          priority: task.priority,
          assigneeId: authUser?.id || currentUser?.userId || currentUserId,
          createdBy: authUser?.id || currentUser?.userId || currentUserId,
        }).catch(reportBackendError);
      }}
      onPersistTaskUpdate={({ taskId, field, value }) => {
        persistTaskUpdate({ taskId, field, value }).catch(reportBackendError);
      }}
      onAddGeneratedTasks={addGeneratedTasks}
      workspaces={workspaces}
      activeWorkspace={activeWorkspace}
      onWorkspaceChange={setActiveWorkspaceId}
      onCreateWorkspace={createWorkspace}
      team={workspaceMembers}
      onTeamChange={setTeam}
      invitations={invitations.filter((invite) => invite.workspaceId === activeWorkspace?.id)}
      onInviteMember={inviteMember}
      onAcceptInvite={acceptInvite}
      onUpdateMemberRole={updateMemberRole}
      currentUser={currentUser}
      currentRole={currentRole}
      comments={comments}
      onAddComment={addComment}
      onEditComment={editComment}
      onDeleteComment={deleteComment}
      activities={activities}
      onAddActivity={addActivity}
    />
  );

  const renderContent = () => {
    if (activeNav === "dashboard") {
      return (
        <Dashboard
          project={project}
          tasks={tasks}
          requirements={requirements}
          team={workspaceMembers}
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
      team={rightPanelTeam}
      activeWorkspace={activeWorkspace}
      currentUser={currentUser}
      currentRole={currentRole}
      comments={comments}
      onAddComment={addComment}
      onEditComment={editComment}
      onDeleteComment={deleteComment}
      activities={activities}
      backendMode={backendMode}
      backendLoading={backendLoading}
      backendError={backendError}
      realtimeStatus={realtimeStatus}
      authUser={authUser}
      authLoading={authLoading}
      authError={authError}
      onLogin={handleLogin}
      onSignUp={handleSignUp}
      onLogout={handleLogout}
    >
      {renderContent()}
    </AppLayout>
  );
}
