# OPERATIONS_RUNBOOK.md

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 1) 사전 점검
1. `corepack pnpm -v` 확인
2. `corepack pnpm lint && corepack pnpm -r typecheck && corepack pnpm test` 실행
3. `multimcp doctor`로 bridge(codex/claude/gemini) 상태 확인
4. MCP 서버 기동 시 `.cowork/db` 자동 부트스트랩 동작 확인
5. 모델 접근성 확인(`gpt-5.3-codex` 미접근 환경은 `MULTIMCP_MODEL_PROFILE=compat` 사용)
   - 실브리지 경로에서는 codex 모델 접근 불가 시 `gpt-5-codex` 자동 폴백이 적용된다.
6. E2E 모델 오버라이드 검증 예시:
   - `MULTIMCP_MODEL_PROFILE=compat corepack pnpm --filter @multimcp/mcp-server test:e2e`
7. 실브리지 통합 테스트(선택):
   - `corepack pnpm test:real-bridges`

## 2) 장애 대응
1. 증상 수집: `request_id`, command, bridge, attempt_no 확보
2. 이벤트 추적: `multimcp events --follow` 또는 세션 이벤트 조회
3. 장애 분류: `AUTH`, `TIMEOUT`, `RATE_LIMIT`, `TOOL_ERROR`, `UNKNOWN`
4. 임시 대응: fallback order 조정, 문제 bridge 제외

## 3) 복구 절차
1. 인증 오류: 환경 변수 갱신 후 doctor 재실행
2. CLI 오류: 해당 CLI 버전 확인 및 재설치
3. 세션 오류: stale thread 롤오버 후 재시도
4. DB 오류: 부트스트랩 경로 확인(`.cowork/db`) 후 재기동
5. 부트스트랩 실패 시: `mkdir -p .cowork/db` 실행 후 서버 재기동

## 4) 롤백
1. 배포 아티팩트 태그 기준 이전 버전 복구
2. DB schema 변경 시 백업 DB로 롤백
3. 롤백 이후 smoke: lint/typecheck/test + doctor

## 5) 릴리스 게이트
1. 품질 게이트 3종 필수 통과
2. 문서 동기화(`PRD`, `TRD`, `M*_TASKS`, `TASKS_INDEX`) 확인
3. changelog 및 마이그레이션 가이드 동봉
4. `corepack pnpm --filter @multimcp/mcp-server build` 통과
5. `corepack pnpm --filter @multimcp/mcp-server test:e2e` 통과
