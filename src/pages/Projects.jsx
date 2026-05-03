import { ArrowRight } from "lucide-react";
import { Button } from "../components/Button.jsx";
import { Card, CardBody, CardHeader } from "../components/Card.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { CreateProjectForm } from "../features/projects/CreateProjectForm.jsx";

export function Projects({ project, draft, onDraftChange, onCreate, onOpenWorkspace }) {
  return (
    <>
      <PageHeader
        eyebrow="프로젝트"
        title="프로젝트 설정"
        description="설정은 짧게 끝내고, 프로젝트를 만든 뒤 바로 워크스페이스로 들어갑니다."
      />

      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <CreateProjectForm draft={draft} onDraftChange={onDraftChange} onCreate={onCreate} />

        <div className="space-y-6">
          {project ? (
            <Card>
              <CardHeader title={project.name} eyebrow="활성 프로젝트">
                {project.description || "설명이 아직 없습니다."}
              </CardHeader>
              <CardBody>
                <Button variant="primary" onClick={onOpenWorkspace}>
                  워크스페이스 들어가기
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </CardBody>
            </Card>
          ) : (
            <EmptyState
              title="아직 프로젝트가 없습니다"
              description="요구사항, 작업, 팀원을 추가하기 전에 하나의 집중된 워크스페이스를 먼저 만드세요."
            />
          )}
        </div>
      </div>
    </>
  );
}
