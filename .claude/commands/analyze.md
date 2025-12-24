# Analyze Project

프로젝트 구조와 코드를 분석합니다.

## 분석 대상

1. **디렉터리 구조**: client/, server/ 구성
2. **의존성**: package.json 분석
3. **API 엔드포인트**: routes/ 분석
4. **컴포넌트**: React 컴포넌트 구조
5. **타입 정의**: TypeScript 인터페이스

## 출력 형식

- 구조 다이어그램
- 주요 파일 목록
- 개선 제안사항

$ARGUMENTS 파라미터로 특정 영역만 분석할 수 있습니다:
- `api`: API 엔드포인트만
- `components`: React 컴포넌트만
- `types`: 타입 정의만
