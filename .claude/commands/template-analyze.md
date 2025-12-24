# Analyze Template

템플릿 파일을 분석하여 플레이스홀더를 추출합니다.

## 분석 대상

### DOCX 파일
- `word/document.xml`: 본문
- `word/header*.xml`: 머리글
- `word/footer*.xml`: 바닥글

### PPTX 파일
- `ppt/slides/*.xml`: 슬라이드
- `ppt/slideLayouts/*.xml`: 레이아웃
- `ppt/slideMasters/*.xml`: 마스터

## 출력 정보

1. 발견된 플레이스홀더 목록
2. 플레이스홀더 위치 (파일/슬라이드)
3. 누락된 필수 플레이스홀더
4. 프로젝트 데이터와 매핑 상태

## 서비스 위치

`server/src/services/templateParser.ts`

$ARGUMENTS: 템플릿 파일 경로 또는 템플릿 ID를 지정합니다.
