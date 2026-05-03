import { Gauge } from "lucide-react";
import { calculateRequirementQualityScore } from "./aiRequirementUtils.js";

const labels = {
  clarity: "명확성",
  completeness: "완성도",
  feasibility: "기술 가능성",
  testability: "테스트 가능성",
};

export function RequirementQualityScore({ analysis }) {
  const score = calculateRequirementQualityScore(analysis);

  return (
    <section className="rounded-lg border border-surface-line bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Gauge size={18} aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink-strong">요구사항 품질 점수</h3>
            <p className="text-xs text-ink-muted">분석 결과의 실행 가능성을 기준으로 계산합니다.</p>
          </div>
        </div>
        <strong className="text-2xl font-semibold text-ink-strong">{score.total}</strong>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Object.entries(labels).map(([key, label]) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-ink-muted">{label}</span>
              <span className="font-semibold text-ink-strong">{score[key]}</span>
            </div>
            <div className="h-2 rounded-full bg-surface-muted">
              <div
                className="h-2 rounded-full bg-brand transition-all duration-300"
                style={{ width: `${score[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
