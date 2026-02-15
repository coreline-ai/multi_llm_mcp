# MultiMCP v2 구현 목표 명세

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 1) 문서 목적
- 기존 Codex 중심 구조를 대체하고, MCP에서 Claude Code CLI / Codex CLI / Gemini CLI를 선택 또는 자동 선택해 실행하는 멀티-브리지 오케스트레이터를 구현한다.
- 리팩토링 시작 전, 팀이 동일한 목표와 완료 기준을 공유하도록 구현 범위와 기준을 명확히 정의한다.

## 2) 배경과 문제 정의
- 기존 구조는 `codex` 중심 하드코딩이 많아 실제 멀티 CLI 전략이 불가능하다.
- “상호 검토”를 하려면 서로 다른 브리지(예: Claude vs Codex, Gemini vs Codex)가 강제되어야 한다.
- MCP가 단순 진입점이 아니라, 케이스 기반 라우팅/폴백/세션 지속/관측 가능성(로깅)까지 담당해야 한다.

## 3) 최종 제품 목표 (Product Goal)
- 단일 MCP 서버에서 아래를 지원한다.
1. 브리지 수동 선택: `claude | codex | gemini`
2. 자동 선택: `auto` 모드에서 작업 타입/컨텍스트/실패 이력 기준 우선 브리지 결정
3. 폴백 체인: 1순위 실패 시 2순위 자동 전환
4. 토론/검토 시 멀티 브리지 실행과 결과 통합

## 4) 범위 (In Scope)
- MCP 툴셋: `review`, `plan`, `fix`, `debate`, `memory`, `cost`
- 공통 브리지 인터페이스와 3개 CLI 어댑터
- 자동 라우터 + 폴백 정책
- 세션 저장소(브리지별 thread/session id)
- 실행 로그/메트릭/에러 분류
- 테스트(단위/통합/e2e 시나리오)

## 5) 비범위 (Out of Scope)
- 웹 대시보드 UI
- 자체 LLM API SDK 직접 연동(이번 버전은 CLI 브리지 우선)
- 완전한 비용 최적화 엔진(기초 예산 경고까지만)

## 6) 기능 요구사항 (Functional Requirements)

### FR-1. 브리지 공통 인터페이스
- 모든 CLI 어댑터는 동일한 인터페이스를 구현해야 한다.
```ts
interface BridgeAdapter {
  name: 'claude' | 'codex' | 'gemini';
  healthCheck(): Promise<HealthStatus>;
  send(input: BridgeInput): Promise<BridgeOutput>;
  resume(sessionId: string, input: BridgeInput): Promise<BridgeOutput>;
  capabilities(): BridgeCapabilities;
}
```

### FR-2. MCP 입력 스키마 확장
- 모든 주요 툴 입력에 `model_selector`를 추가한다.
```json
{
  "model_selector": "auto | claude | codex | gemini | hybrid",
  "fallback": ["codex", "gemini"],
  "constraints": {
    "max_latency_ms": 120000,
    "prefer_cost": "low | balanced | quality"
  }
}
```

### FR-3. Auto 라우팅
- 입력 특성으로 우선 브리지를 결정한다.
- 기본 규칙:
1. `review/fix`: 코드 탐색 도구 안정성이 높은 브리지 우선
2. `plan`: 장문 추론/구조화 출력 안정성 우선
3. `debate`: 서로 다른 브리지 2개 이상 필수

### FR-4. 폴백
- 실패 타입 분류: `UNAVAILABLE`, `AUTH`, `TIMEOUT`, `RATE_LIMIT`, `PARSE_ERROR`
- 폴백은 동일 에러 무한 재시도 금지(브리지별 1회).

### FR-5. 세션 지속
- 단일 `codexThreadId`를 제거하고 브리지별 세션을 저장한다.
```json
{
  "session_id": "s_123",
  "threads": {
    "claude": "cld_xxx",
    "codex": "cdx_xxx",
    "gemini": "gmn_xxx"
  }
}
```

### FR-6. Debate 무결성
- 동일 브리지 2개로 debate 시작 금지.
- 최소 2개 서로 다른 브리지 필요.

### FR-7. 출력 정규화
- 브리지별 출력 포맷 차이를 공통 `NormalizedResult`로 변환한다.
```ts
type NormalizedResult = {
  text: string;
  findings?: Finding[];
  verdict?: 'approved' | 'needs_revision' | 'blocked';
  score?: number;
  usage?: TokenUsage;
  bridge: 'claude' | 'codex' | 'gemini';
  model?: string;
};
```

### FR-8. 보안/실행 제약
- 허용된 실행 명령만 사용(allowlist).
- 워크스페이스 경로 이탈 차단.
- 민감정보 마스킹(DLP) 적용 후 브리지 호출.

### FR-9. 관측 가능성
- 이벤트 로그에 `bridge`, `attempt`, `fallback_from`, `latency_ms`, `token_usage` 저장.
- 장애 분석 가능한 실행 trace 제공.

### FR-10. CLI 의존성 진단
- `doctor`에서 3개 CLI 설치/인증 상태를 개별 진단.
- 누락 시 자동 선택 대상에서 제외.

## 7) 비기능 요구사항 (NFR)
- 신뢰성: 단일 브리지 장애 시 핵심 기능(`review`) 성공률 95% 이상
- 성능: `quick review` p95 120초 이내(로컬 환경 기준)
- 확장성: 신규 브리지 추가 시 어댑터 1개 + 라우팅 규칙 추가로 끝나야 함
- 유지보수성: 하드코딩된 `codex` 문자열 제거, enum/상수화

## 8) 제안 아키텍처

### 8.1 레이어
1. `mcp-server`: 툴 입력 검증, 응답 포맷
2. `orchestrator`: 정책/라우팅/세션/폴백 제어
3. `bridge-registry`: 브리지 등록/조회
4. `bridge-adapters`: claude/codex/gemini CLI 실행
5. `normalizers`: 브리지별 출력 파싱
6. `stores`: session/event/cost 저장

### 8.2 실행 흐름
1. MCP 요청 수신
2. `model_selector` 해석 (`auto`면 라우터 호출)
3. 1순위 브리지 실행
4. 실패 시 에러 분류 후 폴백
5. 결과 정규화 + 저장 + 응답

## 9) Auto 선택 정책 (초안)
- 스코어 기반 선택:
```txt
score = w_quality * quality_fit
      + w_latency * latency_fit
      + w_cost * cost_fit
      + w_health * health_fit
      + w_history * success_history
```
- 기본 가중치(초안):
1. `review`: quality 0.35, latency 0.20, health 0.30, history 0.15
2. `plan`: quality 0.45, latency 0.15, health 0.25, history 0.15
3. `fix`: quality 0.30, latency 0.25, health 0.30, history 0.15

## 10) 데이터 모델 변경
- 세션 테이블:
1. `thread_claude`
2. `thread_codex`
3. `thread_gemini`
- 이벤트 테이블:
1. `bridge`
2. `attempt_no`
3. `fallback_from`
4. `error_type`

## 11) 마이그레이션 전략
1. V1 스키마 백업
2. 새 컬럼 추가(Null 허용)
3. 기존 `codexThreadId` -> `thread_codex` 이관
4. 읽기 경로는 한 버전 동안 하위호환 유지

## 12) 구현 단계 (Milestones)

### M1. Foundation
- 공통 인터페이스/타입/에러 코드 정의
- 브리지 레지스트리 구현
- 기존 codex 경로를 `CodexAdapter`로 캡슐화

### M2. Multi-Bridge
- `ClaudeAdapter`, `GeminiAdapter` 추가
- `doctor` 확장 (3개 CLI 진단)
- config schema 다중 provider 허용

### M3. Routing & Fallback
- auto 라우터 구현
- 폴백 체인 + 실패 분류
- 세션 저장 구조 변경

### M4. Debate Integrity
- debate에 “서로 다른 브리지 강제”
- 라운드별 브리지 로그/결과 통합

### M5. Hardening
- DLP/경로보호/timeout/retry 강화
- 통합 테스트 및 회귀 테스트
- README/운영 문서 갱신

## 13) 테스트 계획
- 단위 테스트:
1. 라우팅 결정
2. 폴백 동작
3. 출력 정규화 파서
- 통합 테스트:
1. `review(auto)` 성공/폴백/실패
2. `debate(hybrid)` 상호 브리지 강제
- E2E:
1. MCP 입력 -> 최종 응답 포맷
2. 세션 재개/rollover

## 14) 완료 기준 (Definition of Done)
1. MCP 모든 주요 툴이 `model_selector` 지원
2. `auto` 모드에서 3개 브리지 중 선택 및 폴백 동작
3. debate 시 동일 브리지 조합 금지
4. 세션/이벤트 저장소가 브리지별 추적 가능
5. 문서/테스트 포함 CI 통과

## 15) 리스크와 대응
- 리스크: CLI 출력 포맷 변경
  - 대응: 브리지별 파서 버전 분리 + 강건 파싱
- 리스크: 특정 CLI 미설치/인증 실패
  - 대응: 헬스체크 기반 자동 제외 + 폴백
- 리스크: 복잡도 증가
  - 대응: 인터페이스 고정, 레이어 분리, 계약 테스트

## 16) 첫 스프린트 권장 작업 순서
1. 타입/스키마/레지스트리 리팩토링
2. Codex 어댑터 분리(기능 유지)
3. Claude/Gemini 어댑터 뼈대 + 헬스체크
4. auto 라우터 + 폴백 연결
5. 세션 스키마 마이그레이션
6. review/debate 우선 연동 후 fix/cleanup 확장
