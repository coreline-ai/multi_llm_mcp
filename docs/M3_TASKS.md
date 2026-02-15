# M3_TASKS.md

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 0) 목표
- routing/fallback/session/observability 고도화.

## 1) 진행 상태
- [x] `M3-000-1` M2 완료 확인 (완료)
- [x] `M3-000-2` 작업 브랜치/워크스페이스 확인 (완료, `not-git`)
- [x] `M3-001` routing 입력 모델 정규화 (완료)
- [x] `M3-002` scorer 고도화 (완료)
- [x] `M3-003` policy별 전략 모듈화 (완료)
- [x] `M3-004` fallback executor 안정화 (완료)
- [x] `M3-005` command별 fallback 정책 반영 (완료)
- [x] `M3-006` 브리지별 세션 재개 통합 (완료)
- [x] `M3-007` 세션 이벤트 라우팅 메타 저장 (완료)
- [x] `M3-008` MCP 응답 routing 메타 확장 (완료)
- [x] `M3-009` CLI selector/policy 옵션 반영 (완료)
- [x] `M3-010` 오류 분류 표준화 (완료)
- [x] `M3-011` 라우팅/폴백 로그 강화 (완료)
- [x] `M3-012` 통합 테스트(auto+fallback) 반영 (완료)
- [x] `M3-013` MCP 계약 테스트 보강 (완료)
- [x] `M3-014` 최종 게이트 (완료)
- [x] `M3-015` 문서 업데이트 (완료)

## 2) 핵심 산출물
1. fallback 시도 체인과 실패 분류가 표준 필드로 저장.
2. `review(auto)` 및 fallback 성공/실패 시나리오가 테스트로 고정.
3. 세션 스토어가 브리지별 thread/active bridge를 일관되게 관리.

## 3) 자체 검증
- [x] `corepack pnpm lint` 통과
- [x] `corepack pnpm -r typecheck` 통과
- [x] `corepack pnpm test` 통과
