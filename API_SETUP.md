# DevGym ProjectOS API 설정 가이드

이 프로젝트에서 실제로 넣어야 하는 API/환경변수는 아래와 같습니다.

## 1. 필수: OpenAI API

AI 요구사항 분석에 사용합니다.

저장 위치:

```txt
.env
```

환경변수:

```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.4-mini
```

주의:

- `OPENAI_API_KEY`는 절대 프론트엔드 코드에 넣으면 안 됩니다.
- 이 키는 `backend/server.js`에서만 읽습니다.
- 프론트엔드는 `/api/ai/analyze-requirement`로 요청하고, Vite proxy가 백엔드로 전달합니다.

관련 파일:

```txt
supabase-schema.sql
backend/routes/aiRoutes.js
backend/services/aiService.js
backend/utils/jsonValidator.js
src/services/aiRequirementService.js
```

## 2. 필수: Supabase

로그인, 워크스페이스, 프로젝트, 요구사항, 작업, 댓글, 활동 로그 저장에 사용합니다.

저장 위치:

```txt
.env
```

환경변수:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

주의:

- `VITE_SUPABASE_ANON_KEY`는 브라우저에 노출되는 public anon key입니다.
- 보안은 `supabase-schema.sql`의 Row Level Security 정책이 담당합니다.
- Supabase SQL Editor에서 `supabase-schema.sql`을 먼저 실행해야 합니다.

관련 파일:

```txt
supabase-schema.sql
src/lib/supabaseClient.js
src/services/authService.js
src/services/workspaceService.js
src/services/projectService.js
src/services/requirementService.js
src/services/taskService.js
src/services/commentService.js
src/services/activityService.js
src/services/realtimeService.js
```

## 3. 선택: API 서버 주소

로컬 개발에서는 비워도 됩니다. Vite가 `/api`를 `http://127.0.0.1:8787`로 프록시합니다.

```bash
VITE_API_BASE_URL=
VITE_ENABLE_AI_FALLBACK=false
```

배포 환경에서 프론트엔드와 백엔드 주소가 다르면 아래처럼 설정합니다.

```bash
VITE_API_BASE_URL=https://your-api-domain.com
```

## 4. 선택: 네이버 로그인 API

현재 앱은 네이버 로그인을 직접 구현한 상태가 아니라, AI가 "네이버 로그인 요구사항"을 분석하고 설계 산출물을 만드는 상태입니다.

나중에 실제 네이버 OAuth 로그인을 구현하려면 백엔드 전용 환경변수를 추가합니다.

```bash
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
NAVER_REDIRECT_URI=http://127.0.0.1:8787/api/auth/naver/callback
```

주의:

- `NAVER_CLIENT_SECRET`도 프론트엔드에 넣으면 안 됩니다.
- 네이버 로그인 실제 구현은 별도 백엔드 라우트가 필요합니다.

## 5. 로컬 실행 순서

터미널 1:

```bash
npm run api
```

터미널 2:

```bash
npm run dev
```

접속:

```txt
http://127.0.0.1:5173/
```

## 6. API 키가 없을 때

- 개발 모드에서는 OpenAI 키가 없거나 API 서버가 꺼져 있으면 로컬 fallback 분석을 표시할 수 있습니다.
- 운영 배포에서는 `VITE_ENABLE_AI_FALLBACK=false`를 유지해서 실제 AI 실패가 mock 결과로 숨겨지지 않게 해야 합니다.
- Supabase 환경변수가 없으면 mock/localStorage 모드로 동작합니다.
- 앱은 중단되지 않고, 화면에 안내 메시지를 보여줍니다.

## 7. 실제 저장에 필요한 Supabase RPC

`supabase-schema.sql`에는 아래 RPC가 포함되어 있습니다.

```txt
create_requirement_analysis
accept_workspace_invitation
```

- `create_requirement_analysis`는 요구사항, 인수 조건, 리스크, 테스트 케이스, 생성 작업, 활동 로그를 하나의 DB 트랜잭션으로 저장합니다.
- `accept_workspace_invitation`은 로그인 이메일과 초대 이메일이 일치할 때만 멤버 추가와 초대 상태 변경을 처리합니다.
