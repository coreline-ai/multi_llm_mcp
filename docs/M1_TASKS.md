# M1_TASKS.md

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 0) 사용 규칙
1. 모든 태스크는 시작 시 `[ ]` 상태다.
2. 태스크 구현 + 자체 검증 테스트 통과 후 `[x]`로 변경한다.
3. 완료 시 항목 끝에 `(완료)`를 추가한다.
4. 테스트 실패 시 `[ ]`로 되돌리고 원인/수정 내용을 태스크 아래에 기록한다.
5. 커밋 메시지는 `M1-XXX: <summary>` 형식을 사용한다.

## 1) M1 범위
1. Bridge 추상화 도입
2. CodexAdapter 캡슐화
3. Claude/Gemini Adapter 초기 구현
4. Router + Fallback 기초 구현
5. Session/DB 스키마 확장
6. MCP schema 확장
7. 최소 테스트 세트 통과

## 2) 선행 조건 체크
- [x] `M1-000-0` M0 완료 상태 확인 (완료)
  - [x] `docs/M0_TASKS.md` 핵심 항목 완료 확인
  - [x] `docs/BASELINE_ANALYSIS.md`와 현재 설계 가정 정합 확인
- [x] `M1-000-1` 로컬 환경 준비 확인 (완료)
  - [x] `node -v` 확인
  - [x] `corepack pnpm -v` 확인
  - [x] 테스트 러너 동작 확인
- [x] `M1-000-2` 작업 브랜치/워크스페이스 확인 (완료)
  - [x] 비-git 워크스페이스(`not-git`) 기준으로 변경 누적 상태 확인

## 3) Core Foundation Tasks
- [x] `M1-001` Bridge 타입/인터페이스 추가 (완료)
- [x] `M1-002` Codex 경로를 `CodexAdapter`로 캡슐화 (완료)
- [x] `M1-003` `ClaudeAdapter` 초기 구현 (완료)
- [x] `M1-004` `GeminiAdapter` 초기 구현 (완료)
- [x] `M1-005` BridgeRegistry 구현 (완료)

## 4) Routing/Fallback Tasks
- [x] `M1-006` Routing 타입 및 정책 정의 (완료)
- [x] `M1-007` Scorer 구현 (완료)
- [x] `M1-008` Selector 구현 (`auto`, `explicit`, `hybrid`) (완료)
- [x] `M1-009` Fallback executor 구현 (완료)

## 5) Session/DB Tasks
- [x] `M1-010` DB migration 추가 (완료)
  - [x] `thread_claude/thread_codex/thread_gemini/active_bridge` 컬럼 추가
  - [x] 이벤트/메시지 테이블 observability 컬럼 추가
  - [x] schema version 증가 (`9`)
- [x] `M1-011` Session store read/write 확장 (완료)
  - [x] bridge별 thread set/get API 추가
  - [x] legacy `codex_thread_id` 하위호환 읽기
  - [x] rollover 호환 유지
- [x] `M1-012` Event 저장 필드 확장 (완료)
  - [x] `request_id/bridge/attempt_no/fallback_from/error_code/routing_reason` 저장
  - [x] 기존 조회 API 호환 유지

## 6) MCP/Orchestrator Tasks
- [x] `M1-013` MCP schema 확장 (완료)
- [x] `M1-014` Orchestrator에 router/fallback 연결 (완료)
- [x] `M1-015` Debate hybrid 무결성 검증 (완료)
  - [x] 동일 브리지 중복 거부
  - [x] 최소 2개 서로 다른 브리지 강제

## 7) CLI/Doctor/Observability Tasks
- [x] `M1-016` Doctor 멀티 CLI 진단 (완료)
- [x] `M1-017` 로그/메트릭 필드 표준화 (완료)
  - [x] request/bridge/attempt/fallback/error 기록
  - [x] routing reason 저장

## 8) Test/Quality Gate Tasks
- [x] `M1-018` Unit Test 묶음 정리 (완료)
- [x] `M1-019` Integration Test 작성 (완료)
- [x] `M1-020` MCP E2E 계약 테스트 (완료)
- [x] `M1-021` 최종 품질 게이트 (완료)
  - [x] lint 통과
  - [x] typecheck 통과
  - [x] test 통과

## 9) 문서 동기화 Tasks
- [x] `M1-022` 문서 동기화 (완료)
  - [x] `README.md` 업데이트
  - [x] `docs/PRD.md` 업데이트
  - [x] `docs/TRD.md` 업데이트
- [x] `M1-023` 완료 보고 업데이트 (완료)
  - [x] 완료 항목 `[x]` 반영
  - [x] 남은 보류 없음

## 10) 자체 검증 결과
- [x] `corepack pnpm lint` → pass
- [x] `corepack pnpm -r typecheck` → pass
- [x] `corepack pnpm test` → pass (`16 files`, `31 tests`)

## 11) 목표 산출물 요약
1. 멀티 브리지 라우팅/폴백/세션/이벤트 파이프라인을 core/mcp/cli 전체에 연결한다.
2. Debate hybrid validation 및 fallback telemetry를 테스트로 고정한다.
3. 문서(PRD/TRD/TASKS/README)와 구현 상태를 동기화한다.

## 12) 후속 보완 이관 항목
1. M1 범위를 넘어서는 운영/계약 안정화 항목은 `docs/M5_TASKS.md`의 `M5-017` ~ `M5-020`으로 이관해 추적한다.
