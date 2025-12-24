# Health Check

시스템 상태를 점검합니다.

## 점검 항목

1. **서버 상태**: GET /api/health
2. **데이터 저장소**: data/store.json 접근 가능 여부
3. **템플릿 디렉터리**: templates/uploads/ 존재 여부
4. **의존성**: node_modules 설치 상태

## 실행

```bash
curl http://localhost:4000/api/health
```

각 항목의 상태를 확인하고 문제가 있으면 해결 방안을 제시해주세요.
