# SI-Doc-Creator PRD (Product Requirements Document)

**문서 번호**: PRD-2025-001
**제품명**: SI-Doc-Creator (DocuGen)
**버전**: 1.0.0
**작성일**: 2025-12-20
**상태**: Alpha

---

## 1. 제품 개요 (Product Overview)

### 1.1 제품 비전
SI(System Integration) 프로젝트에서 반복적으로 작성되는 문서 작업을 자동화하여, PM과 개발팀이 본연의 업무에 집중할 수 있도록 지원하는 **문서 자동 생성 시스템**

### 1.2 문제 정의 (Problem Statement)
| 문제 | 현재 상황 | 영향 |
|:---|:---|:---|
| 문서 작성 시간 과다 | SI 프로젝트당 착수보고서, 요구사항정의서, 완료보고서 등 10종 이상의 문서 작성 필요 | PM 업무 시간의 30% 이상이 문서 작성에 소요 |
| 반복 작업 | 프로젝트명, 고객사, 일정 등 동일 정보를 여러 문서에 중복 입력 | 휴먼 에러 발생, 문서 간 정보 불일치 |
| 양식 불일치 | 담당자별로 문서 양식이 상이함 | 품질 관리 어려움, 브랜드 일관성 저하 |

### 1.3 솔루션 (Solution)
- **템플릿 기반 문서 생성**: 표준 양식 템플릿에 프로젝트 정보를 자동 삽입
- **중앙 집중식 프로젝트 관리**: 한 번 입력한 프로젝트 정보를 모든 문서에 재사용
- **다양한 출력 형식 지원**: DOCX, PPTX, PDF 형식으로 문서 생성

---

## 2. 목표 사용자 (Target Users)

### 2.1 Primary User: SI 프로젝트 PM
- **특성**: 입사 5~15년차, 동시 2~3개 프로젝트 관리
- **니즈**: 문서 작성 시간 단축, 표준 양식 준수
- **기술 수준**: Office 활용 능숙, 웹 애플리케이션 사용에 익숙

### 2.2 Secondary User: PMO/품질관리 담당자
- **특성**: 전사 프로젝트 문서 표준화 담당
- **니즈**: 템플릿 관리, 문서 품질 일관성 확보

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 인증 시스템 (Authentication)
| ID | 요구사항 | 우선순위 | 상태 |
|:---|:---|:---:|:---:|
| AUTH-001 | 사용자 로그인/로그아웃 기능 | High | ✅ 완료 |
| AUTH-002 | 세션 유지 (브라우저 탭 유지 시) | Medium | ✅ 완료 |
| AUTH-003 | 로그인 상태에서만 기능 접근 허용 | High | ✅ 완료 |

**현재 구현**: 클라이언트 사이드 인증 (sessionStorage 기반)
**기본 계정**: `admin` / `admin123`

### 3.2 프로젝트 관리 (Project Management)
| ID | 요구사항 | 우선순위 | 상태 |
|:---|:---|:---:|:---:|
| PRJ-001 | 프로젝트 CRUD (생성/조회/수정/삭제) | High | ✅ 완료 |
| PRJ-002 | 프로젝트 기본 정보 입력 (명칭, 고객사, 기간, 상태) | High | ✅ 완료 |
| PRJ-003 | 팀 구성원 정보 관리 (이름, 역할, 담당업무) | High | ✅ 완료 |
| PRJ-004 | 마일스톤 관리 (명칭, 일정, 산출물) | High | ✅ 완료 |
| PRJ-005 | 요구사항 관리 (기능/비기능, 우선순위) | Medium | ✅ 완료 |

### 3.3 템플릿 관리 (Template Management)
| ID | 요구사항 | 우선순위 | 상태 |
|:---|:---|:---:|:---:|
| TPL-001 | DOCX 템플릿 업로드 | High | ✅ 완료 |
| TPL-002 | PPTX 템플릿 업로드 | High | ✅ 완료 |
| TPL-003 | 템플릿 목록 조회 | High | ✅ 완료 |
| TPL-004 | 템플릿 삭제 | Medium | ✅ 완료 |
| TPL-005 | 플레이스홀더 자동 추출 및 표시 | Medium | ✅ 완료 |

### 3.4 문서 생성 (Document Generation)
| ID | 요구사항 | 우선순위 | 상태 |
|:---|:---|:---:|:---:|
| DOC-001 | 프로젝트 정보 기반 DOCX 생성 | High | ⚠️ 부분완료 |
| DOC-002 | 프로젝트 정보 기반 PPTX 생성 | High | ⚠️ 부분완료 |
| DOC-003 | 프로젝트 정보 기반 PDF 생성 | Medium | ⚠️ 부분완료 |
| DOC-004 | 플레이스홀더 치환 (`{{변수명}}` 형식) | High | ⚠️ 부분완료 |

**알려진 이슈**:
- PDF 생성 시 한글 폰트 미지원 (깨짐 현상)
- DOCX 플레이스홀더가 XML 파편화로 인해 간헐적 치환 실패

---

## 4. 플레이스홀더 명세 (Placeholder Specification)

템플릿 문서에서 사용 가능한 치환 변수 목록:

### 4.1 기본 정보
| 플레이스홀더 | 설명 | 예시 값 |
|:---|:---|:---|
| `{{프로젝트명}}` | 프로젝트 명칭 | 차세대 ERP 구축 |
| `{{고객사}}` | 고객사 명칭 | (주)ABC전자 |
| `{{설명}}` | 프로젝트 개요 | ERP 시스템 전면 재구축... |
| `{{범위}}` | 프로젝트 범위 | 회계, 인사, 생산 모듈 |
| `{{시작일}}` | 착수일 | 2025-01-01 |
| `{{종료일}}` | 완료 예정일 | 2025-12-31 |
| `{{상태}}` | 프로젝트 상태 | 진행중 |

### 4.2 집계 정보
| 플레이스홀더 | 설명 |
|:---|:---|
| `{{팀원수}}` | 등록된 팀원 수 |
| `{{마일스톤수}}` | 등록된 마일스톤 수 |

### 4.3 목록 정보
| 플레이스홀더 | 설명 | 출력 형식 |
|:---|:---|:---|
| `{{팀원목록}}` | 전체 팀원 정보 | `이름 (역할): 담당업무` (줄바꿈 구분) |
| `{{마일스톤목록}}` | 전체 마일스톤 | `명칭 - 일정: 산출물` (줄바꿈 구분) |

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

### 5.1 성능 (Performance)
| ID | 요구사항 | 목표 |
|:---|:---|:---|
| NFR-001 | 문서 생성 응답 시간 | < 5초 |
| NFR-002 | 템플릿 업로드 용량 제한 | 10MB |
| NFR-003 | 동시 사용자 지원 | 10명 (현재 아키텍처 기준) |

### 5.2 호환성 (Compatibility)
| ID | 요구사항 | 지원 범위 |
|:---|:---|:---|
| NFR-004 | 브라우저 지원 | Chrome, Edge, Firefox (최신 버전) |
| NFR-005 | 템플릿 형식 | MS Office 2016 이상 (.docx, .pptx) |

### 5.3 보안 (Security)
| ID | 요구사항 | 현재 상태 |
|:---|:---|:---|
| NFR-006 | 인증된 사용자만 접근 허용 | ⚠️ 클라이언트만 구현 |
| NFR-007 | API 엔드포인트 보호 | ❌ 미구현 |

---

## 6. 시스템 아키텍처 (System Architecture)

### 6.1 기술 스택
```
┌─────────────────────────────────────────────────────────┐
│                      Client                              │
│  React 18 + TypeScript + Vite + Tailwind CSS            │
│  - React Router (라우팅)                                 │
│  - Axios (HTTP 통신)                                    │
│  - Context API (상태관리)                               │
└─────────────────────────┬───────────────────────────────┘
                          │ REST API (Port 5173 → 4000)
┌─────────────────────────┴───────────────────────────────┐
│                      Server                              │
│  Express + TypeScript + Node.js                         │
│  - JSZip (DOCX/PPTX 처리)                               │
│  - PDFKit (PDF 생성)                                    │
│  - Multer (파일 업로드)                                 │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                    Data Storage                          │
│  - JSON File (data/store.json)                          │
│  - File System (templates/uploads/)                      │
└─────────────────────────────────────────────────────────┘
```

### 6.2 API 엔드포인트
| Method | Endpoint | 설명 |
|:---:|:---|:---|
| GET | `/api/projects` | 프로젝트 목록 조회 |
| GET | `/api/projects/:id` | 프로젝트 상세 조회 |
| POST | `/api/projects` | 프로젝트 생성 |
| PUT | `/api/projects/:id` | 프로젝트 수정 |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 |
| GET | `/api/templates` | 템플릿 목록 조회 |
| POST | `/api/templates/upload` | 템플릿 업로드 |
| DELETE | `/api/templates/:id` | 템플릿 삭제 |
| POST | `/api/documents/generate` | 문서 생성 |
| POST | `/api/documents/generate-pdf` | PDF 생성 |
| GET | `/api/health` | 서버 상태 확인 |

---

## 7. 데이터 모델 (Data Model)

### 7.1 Project
```typescript
interface Project {
  id: string                    // UUID
  name: string                  // 프로젝트명
  client: string                // 고객사
  description: string           // 설명
  scope: string                 // 범위
  startDate: string             // 시작일 (YYYY-MM-DD)
  endDate: string               // 종료일 (YYYY-MM-DD)
  status: string                // 상태
  team: TeamMember[]            // 팀 구성원
  milestones: Milestone[]       // 마일스톤
  requirements: {
    functional: Requirement[]   // 기능 요구사항
    nonFunctional: Requirement[] // 비기능 요구사항
  }
  createdAt: string             // 생성일시
  updatedAt: string             // 수정일시
}
```

### 7.2 Template
```typescript
interface Template {
  id: string                    // UUID
  name: string                  // 파일명
  documentType: string          // 문서 유형 (착수보고서, 완료보고서 등)
  format: 'docx' | 'pptx'       // 파일 형식
  filePath: string              // 저장 경로
  placeholders: string[]        // 추출된 플레이스홀더 목록
  createdAt: string             // 생성일시
}
```

---

## 8. 화면 구성 (Screen Flow)

```
로그인 (/login)
    │
    ▼
홈 대시보드 (/)
    │
    ├── 프로젝트 목록 (/projects)
    │       │
    │       ├── 프로젝트 생성 (/projects/new)
    │       │
    │       └── 프로젝트 편집 (/projects/:id)
    │
    ├── 템플릿 관리 (/templates)
    │
    └── 문서 생성 (/generate/:projectId)
```

---

## 9. 릴리즈 계획 (Release Plan)

### v1.0 (Alpha) - 현재
- [x] 기본 인증 시스템
- [x] 프로젝트 CRUD
- [x] 템플릿 업로드/관리
- [x] 기본 문서 생성 (DOCX, PPTX, PDF)

### v1.1 (Beta) - 예정
- [ ] PDF 한글 폰트 지원
- [ ] DOCX 플레이스홀더 파싱 개선 (docxtemplater 도입)
- [ ] 템플릿 검증 기능 (업로드 시 플레이스홀더 미리보기)

### v1.2 - 예정
- [ ] 반복 구문 지원 (`{#list}...{/list}`)
- [ ] 표(Table) 자동 생성
- [ ] 서버 사이드 인증 (API 보호)

### v2.0 - 예정
- [ ] 데이터베이스 연동 (SQLite/PostgreSQL)
- [ ] 사용자 관리 (다중 사용자)
- [ ] 문서 버전 관리

---

## 10. 제약 사항 및 가정 (Constraints & Assumptions)

### 10.1 제약 사항
- 현재 단일 사용자 환경 가정 (동시 편집 미지원)
- 템플릿 파일은 MS Office 형식만 지원
- 데이터는 JSON 파일로 저장 (대용량 데이터 미지원)

### 10.2 가정
- 사용자는 웹 브라우저 접근이 가능한 환경
- 템플릿은 사전에 정의된 플레이스홀더 문법 준수
- 서버와 클라이언트는 동일 네트워크 또는 접근 가능한 환경

---

## 11. 용어 정의 (Glossary)

| 용어 | 정의 |
|:---|:---|
| SI | System Integration, 시스템 통합 |
| PM | Project Manager, 프로젝트 관리자 |
| PMO | Project Management Office, 프로젝트 관리 조직 |
| 플레이스홀더 | 템플릿 내 치환 대상 텍스트 (`{{변수명}}` 형식) |
| 템플릿 | 문서 생성의 기반이 되는 양식 파일 |

---

**문서 이력**
| 버전 | 일자 | 작성자 | 변경 내용 |
|:---:|:---:|:---:|:---|
| 1.0 | 2025-12-20 | DocuGen | 초안 작성 |
