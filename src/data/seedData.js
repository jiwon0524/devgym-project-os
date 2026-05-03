export const workflowSteps = [
  { label: "프로젝트 생성", description: "작업 공간과 범위를 먼저 정리합니다." },
  { label: "요구사항 구조화", description: "막연한 아이디어를 실행 가능한 명세로 바꿉니다." },
  { label: "작업 추적", description: "담당자, 우선순위, 진행 상태를 관리합니다." },
  { label: "팀 협업", description: "역할과 의사결정 흐름을 한곳에 모읍니다." },
];

export const defaultTeam = [
  { id: "u-1", name: "지원", role: "프로덕트 오너", status: "Active" },
  { id: "u-2", name: "민수", role: "프론트엔드 개발자", status: "Active" },
  { id: "u-3", name: "소라", role: "디자이너", status: "Invited" },
];

export const defaultTasks = [
  {
    id: "task-1",
    title: "로그인 예외 흐름 정의",
    status: "Todo",
    assignee: "지원",
    priority: "High",
  },
  {
    id: "task-2",
    title: "인증 폼 상태 디자인",
    status: "In Progress",
    assignee: "소라",
    priority: "Medium",
  },
  {
    id: "task-3",
    title: "사용자 세션 API 계약 작성",
    status: "Todo",
    assignee: "민수",
    priority: "High",
  },
];
