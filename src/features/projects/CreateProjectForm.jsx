import { Plus } from "lucide-react";
import { Button } from "../../components/Button.jsx";
import { Card, CardBody, CardHeader } from "../../components/Card.jsx";
import { FormField, inputClassName, textareaClassName } from "../../components/FormField.jsx";

export function CreateProjectForm({ draft, onDraftChange, onCreate }) {
  return (
    <Card>
      <CardHeader
        eyebrow="1단계"
        title="프로젝트 만들기"
      >
        팀이 바로 이해할 수 있는 최소 정보부터 입력하세요.
      </CardHeader>
      <CardBody>
        <form className="space-y-4" onSubmit={onCreate}>
          <FormField label="프로젝트 이름">
            <input
              data-testid="project-name"
              className={inputClassName}
              value={draft.name}
              onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
              placeholder="프로젝트명"
            />
          </FormField>
          <FormField label="설명">
            <textarea
              data-testid="project-description"
              className={textareaClassName}
              value={draft.description}
              onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
              placeholder="이 프로젝트가 해결하려는 문제를 적어주세요."
            />
          </FormField>
          <Button data-testid="create-project-submit" type="submit" variant="primary" disabled={!draft.name.trim()}>
            <Plus size={16} aria-hidden="true" />
            프로젝트 만들기
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

