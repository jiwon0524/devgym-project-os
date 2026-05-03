import { Loader2, Wand2 } from "lucide-react";
import { Button } from "../../components/Button.jsx";
import { Card, CardBody, CardHeader } from "../../components/Card.jsx";
import { FormField, textareaClassName } from "../../components/FormField.jsx";
import { RequirementAnalysisResult } from "../../features/requirements/RequirementAnalysisResult.jsx";
import {
  RequirementAssistantProvider,
  useRequirementAssistant,
} from "../../features/requirements/RequirementAssistantContext.jsx";

function RequirementInputCard() {
  const { input, onInputChange, analyze, isAnalyzing } = useRequirementAssistant();

  return (
    <Card className="sticky top-6 self-start">
      <CardHeader eyebrow="AI PM 어시스턴트" title="요구사항 분석">
        자연어 요구사항을 기능, UI, API, DB, 작업으로 자동 분해합니다.
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <FormField
            label="요구사항 입력"
            hint='여러 줄로 입력해도 됩니다. 예: "로그인 기능 만들기", "팀원 초대 기능 추가"'
          >
            <textarea
              className={`${textareaClassName} min-h-40`}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="로그인 기능 만들기"
            />
          </FormField>

          <Button variant="primary" onClick={analyze} disabled={!input.trim() || isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Wand2 size={16} aria-hidden="true" />
            )}
            {isAnalyzing ? "분석 중..." : "분석하기"}
          </Button>

          <div className="rounded-lg border border-surface-line bg-surface-muted p-3">
            <p className="text-sm font-medium text-ink-strong">분석 방식</p>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              키워드와 문맥을 바탕으로 도메인을 추론하고, 중복 테이블은 병합하며, 필요한 FK 관계를 제안합니다.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function RequirementsTab({
  requirementInput,
  onRequirementInputChange,
  requirements,
  onRequirementsChange,
  onAddGeneratedTasks,
}) {
  return (
    <RequirementAssistantProvider
      input={requirementInput}
      onInputChange={onRequirementInputChange}
      analysis={requirements}
      onAnalysisChange={onRequirementsChange}
      onAddGeneratedTasks={onAddGeneratedTasks}
    >
      <div className="grid gap-6 p-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <RequirementInputCard />
        <RequirementAnalysisResult />
      </div>
    </RequirementAssistantProvider>
  );
}
