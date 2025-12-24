# Generate PDF Document

PDF 문서를 생성합니다.

## 프로세스

1. 프로젝트 선택 또는 ID 지정
2. PDF 레이아웃 설정
3. 프로젝트 데이터 매핑
4. PDF 생성 실행

## API 엔드포인트

```
POST /api/documents/generate-pdf
Content-Type: application/json

{
  "projectId": "프로젝트ID"
}
```

## 포함 내용

- 프로젝트 기본 정보
- 팀원 목록 테이블
- 마일스톤 일정
- 요구사항 목록

## 주의사항

- PDFKit 사용 (서버사이드 생성)
- 한글 폰트: NotoSansKR 사용
- 저장 경로: 설정 페이지에서 지정 가능

$ARGUMENTS: 프로젝트명 또는 ID를 지정하면 해당 프로젝트로 PDF를 생성합니다.
