import { Metric } from "../../components/Metric.jsx";
import { getRequirementGroupCount } from "../../features/requirements/analyzeRequirement.js";

export function OverviewTab({ project, requirements, tasks, team }) {
  const openTasks = tasks.filter((task) => task.status !== "Done" && task.status !== "완료").length;
  const requirementGroupCount = getRequirementGroupCount(requirements);

  return (
    <div className="space-y-6 p-6">
      <section>
        <h2 className="text-lg font-semibold text-ink-strong">{project.name}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">{project.description}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="요구사항 그룹" value={requirementGroupCount} detail="AI 분석으로 생성됨" />
        <Metric label="진행 중 작업" value={openTasks} detail="할 일 또는 진행 중" />
        <Metric label="팀원" value={team.length} detail="활성 멤버와 초대 인원" />
        <Metric label="일정" value="3단계" detail="기획, 개발, 배포" />
      </div>

      <section className="rounded-lg border border-surface-line bg-white p-5">
        <h3 className="text-base font-semibold text-ink-strong">다음 추천 작업</h3>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          요구사항 탭으로 이동해 팀이 먼저 만들 기능 아이디어를 입력하세요. ProjectOS가 실행 가능한 요구사항 구조로 정리합니다.
        </p>
      </section>
    </div>
  );
}
