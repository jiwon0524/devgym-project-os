# 🧠 DevGym ProjectOS

> **PM과 개발자를 위한 올인원 프로젝트 관리 OS**  
> 요구사항 정의부터 배포까지, 모든 항목이 연결된 추적 가능한 PM 도구

![License](https://img.shields.io/badge/license-MIT-blue)
![HTML](https://img.shields.io/badge/stack-HTML%2FCSS%2FJS-orange)
![No Dependencies](https://img.shields.io/badge/dependencies-none-green)
![localStorage](https://img.shields.io/badge/storage-localStorage-purple)

---

## ✨ 주요 기능

| 메뉴 | 기능 |
|------|------|
| **Dashboard** | 프로젝트 전체 현황, 진행률, 추적 커버리지 |
| **Project Brief** | 프로젝트 개요서 작성, Markdown 복사 |
| **Requirements** | FR/NFR 자동 ID, 우선순위·상태 관리, 연결 추적 |
| **WBS / Tasks** | 칸반 보드 5컬럼 + WBS 테이블, Phase 관리 |
| **Test Cases** | TC 관리, 요구사항 연결, Pass/Fail 기록 |
| **Timeline** | Gantt Chart, 마감 추적, 기한 초과 시각화 |
| **API Spec** | Method/Endpoint/Request/Response 관리 |
| **Risk Management** | 리스크 매트릭스(영향도×가능성), 대응 전략 |
| **Meeting Notes** | 회의록 작성, 액션 아이템 → Task 자동 변환 |
| **Export Center** | Markdown, TSV(Excel), JSON 내보내기, RTM |

---

## 🚀 바로 시작하기

### 방법 1 — GitHub Pages (권장)

```
https://{your-username}.github.io/devgym-project-os/
```

### 방법 2 — 로컬 실행

```bash
git clone https://github.com/{your-username}/devgym-project-os.git
cd devgym-project-os
# index.html을 브라우저로 열면 끝
open index.html
```

> **의존성 없음** — 빌드 불필요, 서버 불필요, npm 불필요  
> 브라우저에서 index.html 파일 하나만 열면 동작합니다.

---

## 📁 파일 구조

```
devgym-project-os/
├── index.html          # 전체 앱 (단일 파일)
├── README.md           # 이 파일
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages 자동 배포
```

---

## 🗂️ 데이터 구조

모든 데이터는 `localStorage`에 JSON으로 저장됩니다.

```
Requirements → Tasks
Requirements → API Spec
Requirements → Test Cases
Meeting Actions → Tasks
```

**RTM (Requirements Traceability Matrix)**으로 요구사항 하나가 어떤 Task, API, TC와 연결되어 있는지 한눈에 추적 가능합니다.

---

## 📤 내보내기

| 형식 | 내용 |
|------|------|
| `.md` | Project Brief, SRS 전체, API Spec |
| `.tsv` | Requirements, WBS/Tasks, Test Cases (Excel 열기 가능) |
| `.json` | 전체 데이터 백업 (복원 가능) |

---

## 🛣️ Roadmap

- [x] Dashboard
- [x] Project Brief
- [x] Requirements (FR/NFR)
- [x] WBS / Kanban Board
- [x] Test Cases
- [x] Timeline / Gantt
- [x] API Spec
- [x] Risk Management
- [x] Meeting Notes
- [x] Export Center (MD/TSV/JSON)
- [ ] Firebase / Supabase 연동
- [ ] 멀티 프로젝트 지원
- [ ] 팀원 초대 / 권한 관리
- [ ] Use Case 다이어그램

---

## 🤝 기여

PR과 Issue 환영합니다.

1. Fork
2. `git checkout -b feature/your-feature`
3. Commit & Push
4. Pull Request

---

## 📄 License

MIT © DevGym Lab
