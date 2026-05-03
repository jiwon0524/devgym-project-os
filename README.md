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
- 기능 요구사항, UI 요구사항, API 설계, DB 스키마, 작업 분해 생성
- ERD 시각화와 PK/FK 표시
- 생성된 작업을 작업 목록에 추가
- 한글 중심의 제품 UI

## 기술 스택

- React
- Vite
- Tailwind CSS
- lucide-react
- localStorage 기반 프로토타입 저장

## 폴더 구조

```txt
src/
  components/      재사용 UI 컴포넌트
  data/            기본 워크플로우, 작업, 팀 데이터
  features/        요구사항 분석 등 도메인 기능
  hooks/           공통 React 훅
  layout/          사이드바, 상세 패널, 앱 레이아웃
  pages/           대시보드, 프로젝트, 워크스페이스 화면
```

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

핵심 분석 로직은 아래 파일에 있습니다.

```txt
src/features/requirements/analyzeRequirement.js
```

입력 예시:

```txt
로그인 기능 만들기
```

생성 결과:

- 기능 요구사항
- UI 요구사항
- API 설계
- 데이터베이스 스키마 및 ERD
- 작업 분해
