# TASKS_INDEX.md

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 1) 문서 목적
이 문서는 `M0_TASKS.md`부터 `M5_TASKS.md`까지의 실행 순서, 의존성, 완료 기준을 한 곳에서 관리하기 위한 인덱스다.
또한 완료 이후 발견된 후속 보완 항목(`M5-017` 이상)도 추적한다.

## 2) 실행 순서
1. `docs/M0_TASKS.md` - Baseline Alignment
2. `docs/M1_TASKS.md` - Foundation
3. `docs/M2_TASKS.md` - Multi-Bridge 확장
4. `docs/M3_TASKS.md` - Routing/Fallback 고도화
5. `docs/M4_TASKS.md` - Debate Integrity
6. `docs/M5_TASKS.md` - Hardening/Release

## 2.1 현재 상태 (2026-02-15)
1. `M0`: 완료 (baseline fact lock + 문서 정합 + 진입 게이트 반영)
2. `M1`: 완료
3. `M2`: 완료
4. `M3`: 완료
5. `M4`: 완료
6. `M5`: 완료
7. `M5 추가 보완`: 완료 (`M5-017` ~ `M5-020`)
8. 브랜치 절차: 현재 워크스페이스는 비-git 저장소(`not-git`) 기준으로 확인/기록

## 3) 단계별 게이트
1. M0 -> M1 진입 조건
- 베이스라인 사실 정합 문서화 완료 (`BASELINE_ANALYSIS.md`)
- debate 기존 동작 회귀 체크리스트 확보

2. M1 -> M2 진입 조건
- Bridge 인터페이스/레지스트리 동작
- 최소 1개 경로에서 auto/fallback smoke pass

3. M2 -> M3 진입 조건
- 3개 브리지 health check 동작
- config/provider 다중 확장 완료

4. M3 -> M4 진입 조건
- review/plan/fix에서 fallback 안정 동작
- 라우팅 reason code 저장

5. M4 -> M5 진입 조건
- debate에서 서로 다른 브리지 강제
- hybrid 시나리오 통합 테스트 통과

## 4) 완료 상태 기록 규칙
1. 각 단계 문서의 태스크는 시작 시 `[ ]`.
2. 구현 + 자체 검증 통과 후 `[x]`로 변경하고 `(완료)`를 항목 끝에 추가.
3. 실패 시 `[ ]`로 되돌리고 항목 아래 원인/다음 액션 기록.

## 5) 전체 품질 게이트
1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. 계약 테스트(MCP input/output) 회귀 없음
5. 문서 동기화(`PRD`, `TRD`, `M*_TASKS`) 완료

## 6) 후속 보완 트래킹 (2026-02-14 추가)
1. `docs/M5_TASKS.md`의 `M5-017` ~ `M5-020`을 우선순위로 관리한다.
2. 해당 항목 완료 후 MCP 릴리스 게이트를 정식 필수 게이트로 승격한다.
