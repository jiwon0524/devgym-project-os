import { ArrowRight } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { Metric } from "../components/Metric.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { workflowSteps } from "../data/seedData.js";
import { getRequirementGroupCount } from "../features/requirements/analyzeRequirement.js";

export function Dashboard({ project, tasks, requirements, team, onStart }) {
  const completedTasks = tasks.filter((task) => task.status === "Done" || task.status === "완료").length;
  const requirementGroupCount = getRequirementGroupCount(requirements);

  return (
    <>
      <PageHeader
        eyebrow="대시보드"
        title="프로젝트 현황"
        description="범위, 요구사항, 작업, 협업 상태를 조용하고 명확하게 확인합니다."
        action={
          <Button variant="primary" onClick={onStart}>
            {project ? "워크스페이스 열기" : "프로젝트 만들기"}
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        {!project ? (
          <EmptyState
            title="프로젝트 생성부터 시작하세요"
            description="ProjectOS는 프로젝트 생성, 요구사항 구조화, 작업 추적, 팀 초대 순서로 자연스럽게 진행됩니다."
            actionLabel="프로젝트 만들기"
            onAction={onStart}
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="프로젝트" value={project.name} detail="활성 워크스페이스" />
              <Metric label="요구사항" value={requirementGroupCount} detail="분석된 그룹" />
              <Metric label="완료 작업" value={`${completedTasks}/${tasks.length}`} detail="진행 상태" />
              <Metric label="팀" value={team.length} detail="멤버와 초대 사용자" />
            </div>

            <section className="rounded-lg border border-surface-line bg-white p-5">
              <h2 className="text-base font-semibold text-ink-strong">작업 흐름</h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-4">
                {workflowSteps.map((step, index) => (
                  <div key={step.label} className="rounded-lg border border-surface-line p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-sm font-semibold text-ink-strong">
                      {index + 1}
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-ink-strong">{step.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">{step.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
