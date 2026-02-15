# M2_TASKS.md

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 0) 목표
- 멀티 브리지(provider/config/registry/CLI surface) 일반화.

## 1) 진행 상태
- [x] `M2-000-1` M1 완료 상태 확인 (완료)
- [x] `M2-000-2` 작업 브랜치/워크스페이스 확인 (완료, `not-git`)
- [x] `M2-001` provider 타입 확장 (완료)
- [x] `M2-002` config schema 확장 (완료)
- [x] `M2-003` defaults/presets 멀티 브리지 갱신 (완료)
- [x] `M2-004` ClaudeAdapter 실행 경로 완성 (완료)
- [x] `M2-005` GeminiAdapter 실행 경로 완성 (완료)
- [x] `M2-006` CodexAdapter 호환성 강화 (완료)
- [x] `M2-007` BridgeRegistry provider 기반 해석 (완료)
- [x] `M2-008` CLI detector 일반화 (완료)
- [x] `M2-009` doctor 멀티 브리지 진단 (완료)
- [x] `M2-010` CLI codex 하드코딩 제거/완화 (완료)
- [x] `M2-011` MCP tool 스키마 provider 독립화 (완료)
- [x] `M2-012` Orchestrator 브리지 독립 API 연결 (완료)
- [x] `M2-013` Normalizer/파싱 fail-safe 경로 정리 (완료)
- [x] `M2-014` 멀티 브리지 통합 테스트 반영 (완료)
- [x] `M2-015` 최종 게이트 (완료)
- [x] `M2-016` 문서 동기화 (완료)

## 2) 핵심 산출물
1. `claude/codex/gemini` 브리지를 동일 인터페이스에서 선택/실행 가능.
2. `model_selector/fallback/routing_policy/constraints`가 MCP/CLI 양쪽에서 동작.
3. doctor 출력이 브리지별 상태를 분리해 제공.

## 3) 자체 검증
- [x] `corepack pnpm lint` 통과
- [x] `corepack pnpm -r typecheck` 통과
- [x] `corepack pnpm test` 통과
