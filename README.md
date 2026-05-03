# DevGym ProjectOS

프로젝트 관리, 요구사항 분석, 작업 추적, 팀 협업을 하나의 흐름으로 연결한 SaaS형 프로젝트 관리 도구입니다.

## 핵심 흐름

1. 프로젝트 생성
2. 프로젝트 워크스페이스 진입
3. 자연어 요구사항 입력
4. AI 요구사항 분석
5. 작업 보드에 자동 반영
6. 팀원 초대와 역할 관리

## 주요 기능

- 3분할 SaaS 레이아웃: 사이드바, 메인 워크스페이스, 오른쪽 상세 패널
- 프로젝트 생성 후 탭 기반 워크스페이스 제공
- 요구사항 AI 분석 어시스턴트
- OpenAI 백엔드 프록시 기반 요구사항 분석
- 기능/비기능 요구사항, UI, API, DB/ERD, 작업, 리스크, 인수 조건, 테스트 케이스 생성
- ERD 시각화와 PK/FK 표시
- 생성된 작업을 작업 목록에 추가
- 팀 워크스페이스 생성, 전환, 멤버 초대
- Owner, Admin, Member, Viewer 역할 기반 권한
- 요구사항, 작업, 프로젝트 맥락을 위한 댓글 패널
- 프로젝트 활동 기록과 실시간 협업 UI
- Supabase Auth, PostgreSQL, RLS, Realtime 연결 레이어
- Supabase 미설정 시 안전한 mock fallback
- 한글 중심의 제품 UI

## 기술 스택

- React
- Vite
- Tailwind CSS
- lucide-react
- Supabase Auth / PostgreSQL / Realtime
- OpenAI Responses API 백엔드 프록시
- localStorage mock fallback

## 폴더 구조

```txt
backend/
  routes/          /api/ai/analyze-requirement 라우트
  services/        OpenAI API 호출, JSON repair 재시도
  utils/           AI JSON schema 검증/정규화
src/
  lib/             Supabase client 설정
  services/        Auth, Workspace, Project, Requirement, Task, Comment, Activity 서비스
  components/      재사용 UI 컴포넌트
  data/            기본 워크플로우, 작업, 팀 데이터
  features/        요구사항 분석 등 도메인 기능
    activity/      프로젝트 활동 로그
    comments/      댓글 시스템
    permissions/   역할 기반 권한 helper
    team/          온라인 멤버, 권한 안내 UI
    workspace/     워크스페이스 mock 데이터 모델
  hooks/           공통 React 훅
  layout/          사이드바, 상세 패널, 앱 레이아웃
  pages/           대시보드, 프로젝트, 워크스페이스 화면
```

## Supabase 연결

1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase-schema.sql`을 실행합니다.
3. `.env.example`을 참고해 `.env`를 만듭니다.

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

환경변수가 없으면 앱은 자동으로 mock 모드로 실행됩니다. 이때 브라우저 로컬 데이터로 저장되며, Supabase 연결 오류 때문에 앱이 멈추지 않습니다.

## 백엔드 구조

주요 서비스 함수는 `src/services`에 분리되어 있습니다.

- `authService.js`: 회원가입, 로그인, 로그아웃, 현재 프로필
- `workspaceService.js`: 워크스페이스, 멤버, 초대
- `projectService.js`: 프로젝트 조회/생성
- `requirementService.js`: 요구사항 분석 결과 저장
- `taskService.js`: 생성 작업 저장, 상태/우선순위 수정
- `commentService.js`: 댓글 생성/수정/삭제
- `activityService.js`: 활동 로그 기록/조회
- `realtimeService.js`: requirements, tasks, comments, activity_logs Realtime 구독

DB 테이블과 RLS 정책은 `supabase-schema.sql`에 있습니다.

## AI 백엔드 연결

프론트엔드는 OpenAI 키를 직접 사용하지 않습니다. 로컬에서는 별도 터미널에서 백엔드를 실행합니다.

필요한 API 키와 넣는 위치는 `API_SETUP.md`에 정리되어 있습니다.

```bash
npm run api
```

`.env`에는 서버 전용 키를 넣습니다.

```bash
OPENAI_API_KEY=your-server-side-openai-key
OPENAI_MODEL=gpt-5.4-mini
```

Vite 개발 서버는 `/api` 요청을 `http://127.0.0.1:8787`로 프록시합니다. 키가 없거나 백엔드가 꺼져 있으면 앱은 친절한 안내와 함께 로컬 분석 fallback으로 임시 실행됩니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 검증

```bash
npm run smoke
```

## AI 요구사항 분석

AI 분석 흐름은 아래 파일에 있습니다.

```txt
backend/routes/aiRoutes.js
backend/services/aiService.js
backend/utils/jsonValidator.js
src/services/aiRequirementService.js
src/features/requirements/RequirementAnalyzer.jsx
src/features/requirements/RequirementResultTabs.jsx
```

입력 예시:

```txt
로그인 기능 만들기
```

생성 결과:

- 기능 요구사항
- 비기능 요구사항
- UI 요구사항
- API 설계
- 데이터베이스 스키마 및 ERD
- 작업 분해
- 리스크
- 인수 조건
- 테스트 케이스

## 협업 데이터 모델

핵심 mock 데이터 모델은 아래 파일에 있습니다.

```txt
src/features/workspace/workspaceData.js
```

주요 구조:

- Workspace: `id`, `name`, `ownerId`, `createdAt`
- WorkspaceMember: `id`, `workspaceId`, `userId`, `role`
- Invitation: `email`, `role`, `status`
- Comment: `targetType`, `targetId`, `authorId`, `body`
- Activity: `actor`, `action`, `target`, `timestamp`

권한 로직:

```txt
src/features/permissions/permissions.js
```

예시:

```js
canUserPerformAction("Admin", "member.invite")
```
