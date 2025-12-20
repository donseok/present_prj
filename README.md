# SI-Doc-Creator (DocuGen)

SI 프로젝트를 위한 문서 자동 생성 시스템입니다. 프로젝트 정보를 관리하고 템플릿 기반으로 DOCX, PPTX, PDF 문서를 생성합니다.

## 주요 기능

- **프로젝트 관리**: 프로젝트 정보 CRUD (이름, 고객사, 설명, 범위, 팀 구성, 마일스톤)
- **폴더 분석**: 프로젝트 폴더를 분석하여 자동으로 정보 추출 (API 비용 없음)
  - README.md, package.json, pom.xml, build.gradle
  - PRD.md, CLAUDE.md, WBS.md
- **템플릿 관리**: DOCX/PPTX 템플릿 업로드 및 관리
- **문서 생성**: 템플릿의 플레이스홀더를 프로젝트 데이터로 치환하여 문서 생성
- **다국어 지원**: 한국어, 영어, 베트남어

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router

### Backend
- Node.js + Express
- TypeScript
- JSZip (문서 생성)
- PDFKit (PDF 생성)

## 설치 및 실행

```bash
# 의존성 설치
npm run install:all

# 개발 서버 실행 (클라이언트 + 서버)
npm run dev

# 클라이언트만 실행 (포트 3000)
npm run dev:client

# 서버만 실행 (포트 4000)
npm run dev:server

# 빌드
npm run build
```

## 프로젝트 구조

```
si-doc-creator/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 공통 컴포넌트
│   │   ├── contexts/       # React Context (인증)
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── services/       # API 서비스
│   │   └── types/          # TypeScript 타입
│   └── ...
├── server/                 # Express 백엔드
│   ├── src/
│   │   ├── generators/     # 문서 생성기 (DOCX, PPTX, PDF)
│   │   ├── routes/         # API 라우트
│   │   ├── services/       # 비즈니스 로직
│   │   └── types/          # TypeScript 타입
│   └── ...
├── data/                   # JSON 데이터 저장소
├── templates/              # 업로드된 템플릿 파일
└── docs/                   # 프로젝트 문서
```

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/projects | 프로젝트 목록 조회 |
| GET | /api/projects/:id | 프로젝트 상세 조회 |
| POST | /api/projects | 프로젝트 생성 |
| PUT | /api/projects/:id | 프로젝트 수정 |
| DELETE | /api/projects/:id | 프로젝트 삭제 |
| GET | /api/templates | 템플릿 목록 조회 |
| POST | /api/templates/upload | 템플릿 업로드 |
| DELETE | /api/templates/:id | 템플릿 삭제 |
| POST | /api/documents/generate | 문서 생성 (DOCX/PPTX) |
| POST | /api/documents/generate-pdf | PDF 문서 생성 |
| POST | /api/analyze/folder | 프로젝트 폴더 분석 |
| GET | /api/analyze/browse | 폴더 탐색 |
| GET | /api/analyze/drives | 드라이브 목록 |

## 템플릿 플레이스홀더

템플릿에서 사용 가능한 플레이스홀더:

| 플레이스홀더 | 설명 |
|-------------|------|
| `{{프로젝트명}}` | 프로젝트 이름 |
| `{{고객사}}` | 고객사명 |
| `{{설명}}` | 프로젝트 설명 |
| `{{범위}}` | 수행 범위 |
| `{{시작일}}` | 프로젝트 시작일 |
| `{{종료일}}` | 프로젝트 종료일 |
| `{{상태}}` | 프로젝트 상태 |
| `{{팀원수}}` | 팀원 수 |
| `{{마일스톤수}}` | 마일스톤 수 |
| `{{팀원목록}}` | 팀원 목록 (이름 - 역할) |
| `{{마일스톤목록}}` | 마일스톤 목록 |

## 기본 계정

- **아이디**: admin
- **비밀번호**: admin123

## 라이선스

© 2025 Dongkuk Systems. All rights reserved.
