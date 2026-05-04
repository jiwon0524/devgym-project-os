# 현업형 요구분석/설계 산출물 체크리스트

DevGym ProjectOS를 단순 프로젝트 관리 UI가 아니라 실무형 AI PM/소프트웨어공학 도구로 확장하기 위한 산출물 기준입니다.

## 1. 제품/기획 문서

- Product Brief: 문제, 대상 사용자, 핵심 가치, 성공 지표
- PRD: 목표, 범위, 제외 범위, 기능 요구사항, 릴리즈 기준
- Stakeholder Map: PO, PM, 개발자, 디자이너, QA, 운영자 역할
- User Journey Map: 사용자가 아이디어에서 배포까지 거치는 흐름
- User Story Map: 에픽, 사용자 스토리, 릴리즈 단위 우선순위

## 2. 요구사항 엔지니어링

- Functional Requirements: 기능별 동작 요구사항
- Non-Functional Requirements: 보안, 성능, 확장성, 접근성, 가용성
- Acceptance Criteria: Given/When/Then 기준
- Requirement Traceability Matrix: 요구사항, API, DB, 작업, 테스트 연결
- Risk Register: 리스크, 심각도, 대응 전략, 담당자
- Change Log: 요구사항 변경 이력과 의사결정 근거

## 3. UML/모델링 산출물

- Use Case Diagram: 액터와 사용 사례
- Activity Diagram: 업무 흐름과 분기 조건
- Sequence Diagram: 프론트, 백엔드, DB, 외부 API 호출 순서
- State Machine Diagram: 작업, 초대, 요구사항 상태 전이
- Class/Domain Model: 핵심 도메인 객체와 관계
- Component Diagram: React, API 서버, Supabase, AI API 구조
- Deployment Diagram: 로컬, 배포, DB, 외부 API 배치 구조

## 4. 기술 설계 문서

- ERD: 테이블, PK/FK, 관계, 제약 조건
- API Spec: REST endpoint, request/response, error code
- OpenAPI 문서: 백엔드 API 표준 문서화
- ADR: 중요한 기술 결정과 대안 비교
- Security Design: 인증, 권한, RLS, rate limit, secret 관리
- Realtime Design: presence, broadcast, DB change subscription 정책

## 5. 개발/QA 문서

- Task Breakdown: 구현 작업, 담당자, 우선순위, 예상 난이도
- Test Plan: 단위, 통합, E2E, 권한, 회귀 테스트 범위
- Test Cases: Given/When/Then 기반 상세 테스트
- Definition of Ready: 개발 착수 전 준비 기준
- Definition of Done: 완료 판정 기준
- Release Notes: 배포 변경 사항과 영향 범위

## 6. 현재 앱에 우선 추가하면 좋은 기능

1. 산출물 탭
   - 요구사항 분석 결과를 문서형 산출물로 모아 보는 화면
   - PRD, API Spec, ERD, 테스트 계획, 리스크를 탭으로 제공

2. 요구사항 추적 매트릭스
   - 요구사항 하나가 어떤 API, DB 테이블, 작업, 테스트 케이스와 연결되는지 표시

3. UML 다이어그램 생성
   - AI 분석 결과로 Use Case, Sequence, Activity Diagram을 Mermaid로 생성

4. ADR 기록
   - Supabase, OpenAI, 인증 방식 같은 의사결정을 짧은 결정 문서로 저장

5. 승인 워크플로우
   - 요구사항 상태를 Draft, Review, Approved, Implementing, Done으로 관리

6. QA/Test 탭
   - 테스트 케이스, 테스트 상태, 실패 리포트, 회귀 체크리스트 관리

## 7. 제품 방향성

이 앱은 단순히 "작업을 관리하는 도구"보다 "아이디어를 실무 개발 산출물로 변환하는 AI PM 도구"가 더 강한 포지션입니다.

따라서 다음 개발 우선순위는 프로젝트 관리 기능 추가보다 요구사항에서 설계, 작업, 테스트, 검증까지 이어지는 traceability 강화가 좋습니다.
