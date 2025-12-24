# List Templates

등록된 템플릿 목록을 조회합니다.

## API 엔드포인트

```
GET /api/templates
```

## 응답 정보

각 템플릿별:
- ID, 이름, 문서 유형
- 형식 (docx/pptx)
- 파일 경로
- 추출된 플레이스홀더 목록

## 필터링

$ARGUMENTS로 필터 지정:
- `docx`: DOCX 템플릿만
- `pptx`: PPTX 템플릿만
- `제안서`, `보고서` 등: 문서 유형으로 필터

템플릿이 없으면 샘플 템플릿 생성을 안내합니다.
