# Generate DOCX Document

DOCX 문서를 생성합니다.

## 프로세스

1. 프로젝트 선택 또는 ID 지정
2. DOCX 템플릿 선택
3. 플레이스홀더 매핑 확인
4. 문서 생성 실행

## API 엔드포인트

```
POST /api/documents/generate
Content-Type: application/json

{
  "projectId": "프로젝트ID",
  "templateId": "템플릿ID",
  "format": "docx"
}
```

## 플레이스홀더

- `{{프로젝트명}}`, `{{고객사}}`, `{{설명}}`
- `{{시작일}}`, `{{종료일}}`, `{{상태}}`
- `{{팀원목록}}`, `{{마일스톤목록}}`

$ARGUMENTS: 프로젝트명 또는 ID를 지정하면 해당 프로젝트로 문서를 생성합니다.
