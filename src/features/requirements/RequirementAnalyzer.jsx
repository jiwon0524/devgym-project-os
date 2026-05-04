import { Loader2, RefreshCw, Wand2 } from "lucide-react";
import { Button } from "../../components/Button.jsx";
import { Card, CardBody, CardHeader } from "../../components/Card.jsx";
import { FormField, textareaClassName } from "../../components/FormField.jsx";
import { canUserPerformAction } from "../permissions/permissions.js";
import { PermissionNotice } from "../team/PermissionNotice.jsx";
import { RequirementQualityScore } from "./RequirementQualityScore.jsx";

export function RequirementAnalyzer({
  input,
  onInputChange,
  analysis,
  isAnalyzing,
  error,
  currentRole,
  onAnalyze,
  onRegenerate,
}) {
  const canEditRequirements = canUserPerformAction(currentRole, "requirement.edit");
  const canRegenerate = Boolean(analysis && input.trim() && !isAnalyzing && canEditRequirements);

  return (
    <Card className="sticky top-6 self-start">
      <CardHeader eyebrow="AI 설계 어시스턴트" title="실제 AI 요구사항 분석">
        자연어 아이디어를 요구사항, API, DB, 작업, 리스크, 테스트 케이스까지 구조화합니다.
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <FormField
            label="요구사항 입력"
            hint='예: "네이버 로그인으로 회원가입하고, 팀 프로젝트를 만들고, 팀원이 댓글을 달 수 있게 해줘"'
          >
            <textarea
              data-testid="requirement-input"
              className={`${textareaClassName} min-h-48`}
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="네이버 로그인으로 회원가입하고, 팀 프로젝트를 만들고, 팀원이 댓글을 달 수 있게 해줘"
              disabled={!canEditRequirements || isAnalyzing}
            />
          </FormField>

          <PermissionNotice role={currentRole} actionLabel="AI 요구사항 분석" visible={!canEditRequirements} />

          <div className="flex flex-wrap gap-2">
            <Button
              data-testid="analyze-requirement-submit"
              variant="primary"
              onClick={onAnalyze}
              disabled={!input.trim() || isAnalyzing || !canEditRequirements}
            >
              {isAnalyzing ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Wand2 size={16} aria-hidden="true" />
              )}
              {isAnalyzing ? "AI 분석 중..." : "AI 분석하기"}
            </Button>
            <Button variant="secondary" onClick={onRegenerate} disabled={!canRegenerate}>
              <RefreshCw size={16} aria-hidden="true" />
              다시 생성
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
              {error}
            </div>
          ) : null}

          {analysis?.meta?.warning ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
              {analysis.meta.warning}
            </div>
          ) : null}

          {analysis ? <RequirementQualityScore analysis={analysis} /> : null}
        </div>
      </CardBody>
    </Card>
  );
}
