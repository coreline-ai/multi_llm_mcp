# M4_TASKS.md

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 0) 목표
- debate hybrid integrity + persistence + response contract 강화.

## 1) 진행 상태
- [x] `M4-000-1` M3 완료 확인 (완료)
- [x] `M4-000-2` 작업 브랜치/워크스페이스 확인 (완료, `not-git`)
- [x] `M4-001` debate 입력 검증 강화 (완료)
- [x] `M4-002` Debate Engine 초기화 검증 (완료)
- [x] `M4-003` 라운드별 브리지 매핑 전략 반영 (완료)
- [x] `M4-004` 턴 실행 실패 fallback 정책 반영 (완료)
- [x] `M4-005` debate store 스키마 확장/호환 (완료)
- [x] `M4-006` idempotency/재실행 안정화 (완료)
- [x] `M4-007` debate 결과 정규화 포맷 통일 (완료)
- [x] `M4-008` consensus/stance 평가 보강 (완료)
- [x] `M4-009` MCP debate 응답 메타 확장 (완료)
- [x] `M4-010` CLI debate UX 개선 (완료)
- [x] `M4-011` debate trace 강화 (완료)
- [x] `M4-012` 통합 테스트(hybrid debate E2E) 반영 (완료)
- [x] `M4-013` 최종 게이트 (완료)
- [x] `M4-014` 문서 업데이트 (완료)

## 2) 핵심 산출물
1. hybrid participants 중복/단일 브리지 구성을 검증 단계에서 차단.
2. debate turn/메시지 상태가 회귀 테스트로 고정.
3. MCP debate contract에서 participants/round/error 메타를 안정적으로 제공.

## 3) 자체 검증
- [x] `corepack pnpm lint` 통과
- [x] `corepack pnpm -r typecheck` 통과
- [x] `corepack pnpm test` 통과
