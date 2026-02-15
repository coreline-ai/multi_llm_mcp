# RELEASE_SUMMARY.md

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 릴리스 요약본이다.
> 기준 일자: `2026-02-15`

## 1) 릴리스 요약
MultiMCP는 멀티 브리지 MCP 서버 목표(M0~M5)를 기준으로 구현/테스트/문서 동기화를 완료했다.

릴리스 판단:
1. 상태: `GO`
2. 근거: 품질 게이트(`lint`, `typecheck`, `test`, `test:mcp-gate`) 전체 통과
3. 범위: `@multimcp/core`, `@multimcp/mcp-server`, `@multimcp/cli`, `@multimcp/web(placeholder)`

## 2) 범위 및 변경점
1. Core
- 브리지 추상화(`codex/claude/gemini`), 레지스트리, 라우팅/스코어링/폴백 실행기
- 세션/이벤트 저장 확장, 마이그레이션(version `9`)
- DLP/프롬프트 제약/요청 추적(`requestId`) 연결
- debate 무결성(참여자 검증/멱등성/합의 메타) 강화

2. MCP Server
- MCP tool 매핑: `multimcp_review/plan/fix/debate/memory/cost`
- stdio 서버 및 `.cowork/db` 부트스트랩 경로 자동 준비
- 계약 테스트(e2e) 기준 응답 형식 고정

3. CLI
- `doctor` 명령 및 멀티 브리지 상태 진단 (`multimcp`)
- `review/plan/fix/debate/memory/cost` 실행 옵션 파싱/입력 매핑
- 타입체크 안정화를 위해 프로젝트 레퍼런스 빌드 방식으로 정렬

4. 문서
- `docs/M0_TASKS.md` ~ `docs/M5_TASKS.md` 체크리스트 완료 반영
- `docs/TASKS_INDEX.md` 현재 상태를 M0~M5 완료 기준으로 갱신
- 운영 절차는 `docs/OPERATIONS_RUNBOOK.md` 기준으로 정렬

## 3) 검증 결과
아래 명령을 `2026-02-15`에 재실행해 통과 확인했다.

1. `corepack pnpm -r typecheck`
- 결과: pass

2. `corepack pnpm lint`
- 결과: pass

3. `corepack pnpm test`
- 결과: pass (core/cli/mcp-server 전체 테스트 통과, 실브리지 전용 테스트는 opt-in)
- 포함: CLI 출력 파서 계약 테스트(`bridge-parsers.test.ts`)

4. `corepack pnpm test:mcp-gate`
- 결과: pass (`@multimcp/mcp-server build` + `tests/e2e.test.ts 2/2`)

## 4) 운영 체크리스트
릴리스/운영 시 아래 순서 준수:

1. `corepack pnpm lint && corepack pnpm -r typecheck && corepack pnpm test`
2. `corepack pnpm test:mcp-gate`
3. `multimcp doctor`
4. MCP 서버 기동 후 `.cowork/db` 자동 준비 확인
5. 필요 시 `MULTIMCP_MODEL_PROFILE=compat`로 모델 접근성 우회
6. 실브리지 통합 검증 필요 시 `corepack pnpm test:real-bridges` 실행

세부 절차는 `docs/OPERATIONS_RUNBOOK.md`를 단일 기준으로 사용한다.

## 5) 알려진 제약
1. 현재 작업 공간은 비-git 환경(`not-git`)이라 브랜치 기반 릴리스 절차는 적용되지 않는다.
2. 외부 CLI(codex/claude/gemini) 인증/버전 상태는 런타임 환경 의존이다.
3. SQLite 저장소는 기본적으로 로컬 파일 기반 운영이다.

## 6) 산출물 인덱스
1. 요구사항: `docs/PRD.md`, `docs/TRD.md`, `docs/IMPLEMENTATION_GOAL.md`
2. 실행 트래킹: `docs/TASKS_INDEX.md`, `docs/M0_TASKS.md` ~ `docs/M5_TASKS.md`
3. 운영/복구: `docs/OPERATIONS_RUNBOOK.md`
