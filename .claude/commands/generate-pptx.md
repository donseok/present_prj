# Generate PPTX Document

PPTX 프레젠테이션을 생성합니다.

## 프로세스

1. 프로젝트 선택 또는 ID 지정
2. PPTX 템플릿 선택
3. 슬라이드별 플레이스홀더 매핑
4. 프레젠테이션 생성 실행

## API 엔드포인트

```
POST /api/documents/generate
Content-Type: application/json

{
  "projectId": "프로젝트ID",
  "templateId": "템플릿ID",
  "format": "pptx"
}
```

## 처리 대상

- 슬라이드 본문 (ppt/slides/*.xml)
- 슬라이드 레이아웃 (ppt/slideLayouts/*.xml)
- 슬라이드 마스터 (ppt/slideMasters/*.xml)

$ARGUMENTS: 프로젝트명 또는 ID를 지정하면 해당 프로젝트로 프레젠테이션을 생성합니다.
