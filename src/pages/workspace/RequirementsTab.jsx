import { useMemo, useState } from "react";
import { RequirementAnalyzer } from "../../features/requirements/RequirementAnalyzer.jsx";
import { RequirementResultTabs } from "../../features/requirements/RequirementResultTabs.jsx";
import { getTaskKey, normalizeAiRequirementResult } from "../../features/requirements/aiRequirementUtils.js";
import { canUserPerformAction } from "../../features/permissions/permissions.js";
import { analyzeRequirementWithFallback } from "../../services/aiRequirementService.js";
import { saveEngineeringArtifacts } from "../../services/artifactService.js";

export function RequirementsTab({
  project,
  requirementInput,
  onRequirementInputChange,
  requirements,
  onRequirementsChange,
  onAddGeneratedTasks,
  currentRole,
  currentUser,
  onAddActivity,
  onOpenTasks,
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [selectedTaskKeys, setSelectedTaskKeys] = useState([]);
  const analysis = useMemo(() => normalizeAiRequirementResult(requirements), [requirements]);

  const runAnalysis = async () => {
    const input = requirementInput.trim();
    if (!input || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisError("");
    try {
      const nextAnalysis = await analyzeRequirementWithFallback({
        projectId: project?.id,
        input,
      });
      const savedAnalysis = (await onRequirementsChange(nextAnalysis)) || nextAnalysis;
      setSelectedTaskKeys(savedAnalysis.tasks.map(getTaskKey));
      onAddActivity?.(
        nextAnalysis.meta?.provider === "openai" ? "AI 요구사항을 생성했습니다" : "요구사항을 로컬 분석했습니다",
        nextAnalysis.summary,
        currentUser?.name
      );
    } catch (error) {
      setAnalysisError(error?.message || "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTask = (task) => {
    const key = getTaskKey(task);
    setSelectedTaskKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const addSelectedTasks = () => {
    if (!analysis) return 0;
    const selectedTasks = analysis.tasks.filter((task) => selectedTaskKeys.includes(getTaskKey(task)));
    return onAddGeneratedTasks(selectedTasks);
  };

  const convertToTaskBoard = () => {
    if (!analysis) return;
    onAddGeneratedTasks(analysis.tasks);
    onOpenTasks?.();
  };

  const saveArtifacts = async (normalizedAnalysis) => {
    if (!project?.workspaceId || !project?.id) {
      throw new Error("프로젝트와 워크스페이스 정보가 필요합니다.");
    }

    const requirementId = normalizedAnalysis?.id || requirements?.id;
    if (!requirementId) {
      throw new Error("먼저 AI 분석 결과를 요구사항으로 저장해야 산출물 버전을 만들 수 있습니다.");
    }

    const saved = await saveEngineeringArtifacts({
      workspaceId: project.workspaceId,
      projectId: project.id,
      requirementId,
      analysis: normalizedAnalysis,
      createdBy: currentUser?.userId || currentUser?.id,
    });

    onAddActivity?.("요구사항 산출물을 버전으로 저장했습니다", `${saved.length}개 문서`, currentUser?.name);
    return saved;
  };

  return (
    <div className="grid gap-6 p-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <RequirementAnalyzer
        input={requirementInput}
        onInputChange={onRequirementInputChange}
        analysis={analysis}
        isAnalyzing={isAnalyzing}
        error={analysisError}
        currentRole={currentRole}
        onAnalyze={runAnalysis}
        onRegenerate={runAnalysis}
      />
      <RequirementResultTabs
        analysis={analysis}
        selectedTaskKeys={selectedTaskKeys}
        onToggleTask={toggleTask}
        onAddSelectedTasks={addSelectedTasks}
        onConvertToTaskBoard={convertToTaskBoard}
        onSaveArtifacts={saveArtifacts}
        canSaveArtifacts={canUserPerformAction(currentRole, "artifact.save")}
      />
    </div>
  );
}
