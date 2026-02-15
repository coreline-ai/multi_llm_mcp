# M5_TASKS.md

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 0) 목표
- 보안/신뢰성/운영성/릴리스 게이트까지 포함한 하드닝.

## 1) 진행 상태
- [x] `M5-000-1` M4 완료 확인 (완료)
- [x] `M5-000-2` 작업 브랜치/워크스페이스 확인 (완료, `not-git`)
- [x] `M5-001` 실행 명령 제약/검증 경로 확정 (완료)
- [x] `M5-002` 인자/경로 검증 강화 (완료)
- [x] `M5-003` DLP 적용 범위 확장 (완료)
- [x] `M5-004` retry/backoff 기반 복구 경로 강화 (완료)
- [x] `M5-005` timeout/idle-timeout 표준화 (완료)
- [x] `M5-006` 세션 복구 내구성 강화 (완료)
- [x] `M5-007` 성능 측정/검증 루틴 반영 (완료)
- [x] `M5-008` 대용량 컨텍스트 처리 안정화 (완료)
- [x] `M5-009` 메트릭 수집 표준화 (완료)
- [x] `M5-010` trace/request_id end-to-end 연결 (완료)
- [x] `M5-011` 운영 문서/절차 정리 (완료)
- [x] `M5-012` 계약/회귀 테스트 팩 확장 (완료)
- [x] `M5-013` 보안 회귀 테스트 반영 (완료)
- [x] `M5-014` 릴리스 체크리스트 검증 (완료)
- [x] `M5-015` 최종 품질 게이트 (완료)
- [x] `M5-016` PRD/TRD/TASKS 최종 동기화 (완료)

## 2) 핵심 산출물
1. 실행 경로의 검증/재시도/로깅 정책이 표준화되어 운영 안정성 확보.
2. 테스트/문서/실행 파이프라인이 루트 워크스페이스 기준으로 정렬.
3. 릴리스 직전 품질 게이트를 반복 가능한 명령으로 고정.

## 3) 자체 검증
- [x] `corepack pnpm lint` 통과
- [x] `corepack pnpm -r typecheck` 통과
- [x] `corepack pnpm test` 통과

## 4) 추가 보완 항목 (신규, 2026-02-14)
- [x] `M5-017` MCP debate 계약/구현/테스트 정합 고정 (완료)
  - [x] `multimcp_debate` 응답 형식을 `status/responses/totalTokenUsage` 계약으로 문서 고정
  - [x] debate E2E 하네스 검증 로직을 계약 필드 기준으로 유지
- [x] `M5-018` 모델 접근성 프로파일 표준화 (완료)
  - [x] `gpt-5.3-codex` 접근 불가 환경을 위한 대체 프로파일(`gpt-5-codex`) 운영 가이드 추가
  - [x] E2E 실행 시 모델 선택/오버라이드 절차를 문서화
- [x] `M5-019` MCP 서버 부트스트랩 안정성 강화 (완료)
  - [x] `.cowork/db` 경로 자동 생성 또는 선행 체크를 서버 기동 절차에 강제
  - [x] 초기 기동 실패 시 진단 메시지와 복구 절차를 runbook에 명시
- [x] `M5-020` 릴리스 게이트 강화 (MCP 전용) (완료)
  - [x] `corepack pnpm --filter @multimcp/mcp-server build`를 필수 게이트에 추가
  - [x] `corepack pnpm --filter @multimcp/mcp-server test:e2e`를 필수 게이트에 추가

## 5) 추가 보완 자체 검증 (2026-02-15)
- [x] `corepack pnpm lint` 통과
- [x] `corepack pnpm -r typecheck` 통과
- [x] `corepack pnpm test` 통과 (`16 files`, `31 tests`)
- [x] `corepack pnpm test:mcp-gate` 통과 (`mcp-server build + e2e 2/2`)
