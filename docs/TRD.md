# TRD: Multi-Bridge MCP Orchestrator v2 (Technical Requirements Document)

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 0. 문서 메타
- 문서명: `TRD.md`
- 버전: `v1.2`
- 작성일: `2026-02-14`
- 참조 문서: `docs/PRD.md`, `docs/IMPLEMENTATION_GOAL.md`
- 구현 기준선: `M0~M5 Task Tracking`

## 0.1 구현 목표 상태 (2026-02-14 기준)
1. M1 foundation(Bridge/Routing/Session/MCP/Observability) 구현 목표
2. DB schema version `9`까지 migration 반영 목표
3. debate hybrid participant validation + review fallback integration test 반영 목표
4. 품질 게이트 기준: lint/typecheck/test

## 1. 기술 목표
1. Codex 단일 하드코딩 경로를 제거하고 Bridge 추상화 계층을 도입한다.
2. MCP 요청을 브리지 선택(`claude`, `codex`, `gemini`, `auto`, `hybrid`) 기반으로 실행한다.
3. 브리지별 세션 식별자(thread/session)를 영속화한다.
4. 실패 분류와 폴백 체인을 표준화한다.
5. 기능/관측/테스트 기준이 명시된 상태에서 M1 구현을 완료한다.

## 1.1 베이스라인 전제
1. `debate` 기능은 이미 구현되어 동작한다.
2. 현재 debate의 자동 오케스트레이션은 multimcp 내부가 아니라 외부 host(예: Claude Code skill)에서 수행될 수 있다.
3. 이번 리팩토링은 debate 기능 신규 개발이 아니라, 기존 동작을 보존하며 멀티 브리지 일반화를 수행한다.

## 2. 시스템 아키텍처 (목표 구조)

### 2.1 레이어
1. `mcp-server`
- 입력 스키마 검증
- tool command -> orchestration call 라우팅
- 표준 응답 포맷 직렬화

2. `core/orchestrator`
- model selector 해석
- router 호출 및 fallback 제어
- DLP 전처리/정규화 후 결과 반환

3. `core/bridges`
- 브리지 공통 인터페이스
- CLI 실행 어댑터 구현(claude/codex/gemini)
- health check + capability 제공

4. `core/routing`
- auto selector 스코어링
- 정책 기반 우선순위 산출
- fallback 실행 제어

5. `core/session + memory`
- 브리지별 세션 ID 저장/조회
- 실행 이벤트/오류/라우팅 근거 저장

6. `core/normalizers`
- 브리지별 출력 파싱
- findings/verdict/score 정규화

### 2.2 요청 처리 시퀀스
1. MCP tool 요청 수신
2. schema 검증 + default 보정
3. `model_selector` 해석
4. 라우터가 우선순위 리스트 생성
5. 1순위 브리지 실행
6. 실패 시 에러 분류 후 폴백 여부 판단
7. 폴백 실행 또는 실패 반환
8. 성공 결과 정규화
9. session/event 저장
10. MCP 응답 반환

## 3. 모듈 기술 요구사항

## 3.1 Bridge 계층

### 3.1.1 타입 계약
```ts
export type BridgeName = 'claude' | 'codex' | 'gemini';

export type BridgeCommand =
  | 'review'
  | 'plan'
  | 'fix'
  | 'debate'
  | 'cleanup'
  | 'memory'
  | 'cost'
  | 'custom';

export type BridgeErrorCode =
  | 'UNAVAILABLE'
  | 'AUTH'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'PARSE_ERROR'
  | 'TOOL_ERROR'
  | 'UNKNOWN';

export interface BridgeInput {
  command: BridgeCommand;
  prompt: string;
  cwd?: string;
  sessionId?: string;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}

export interface BridgeOutput {
  text: string;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  latencyMs: number;
  sessionId?: string;
  raw?: unknown;
}

export interface BridgeAdapter {
  name: BridgeName;
  healthCheck(): Promise<{ available: boolean; authOk?: boolean; reason?: string }>;
  send(input: BridgeInput): Promise<BridgeOutput>;
  resume(sessionId: string, input: BridgeInput): Promise<BridgeOutput>;
  capabilities(): {
    supportsResume: boolean;
    supportsTools: boolean;
    supportsCwd: boolean;
    maxContextTokens?: number;
  };
}
```

### 3.1.2 어댑터 구현 규칙
1. 어댑터는 shell injection 방지를 위해 인자 배열 기반으로 실행한다.
2. 허용 command는 config allowlist를 통과해야 한다.
3. `cwd`는 workspace root 하위인지 검증해야 한다.
4. timeout + idle timeout + max output bytes를 강제한다.
5. resume 실패 시 에러 코드 `PARSE_ERROR` 또는 `TOOL_ERROR`로 분류하고 상위 fallback에 위임한다.

### 3.1.3 Codex Adapter 요구
1. 기존 동작과 100% 호환되어야 한다.
2. 기존 JSONL parser 로직은 adapter 내부 전용 함수로 이동한다.

### 3.1.4 Claude/Gemini Adapter 요구
1. M1에서는 send/healthCheck 우선 구현.
2. resume는 미지원 시 fallback behavior를 명확히 문서화한다.
3. M1 내 최소 구현은 stub이 아닌 실제 호출 가능 구조여야 한다.

## 3.2 Routing 계층

### 3.2.1 입력 계약
```ts
interface RoutingInput {
  selector: 'auto' | 'claude' | 'codex' | 'gemini' | 'hybrid';
  command: BridgeCommand;
  policy: 'default' | 'quality_first' | 'speed_first' | 'cost_first';
  fallback?: BridgeName[];
  constraints?: {
    maxLatencyMs?: number;
    maxRetriesPerBridge?: number;
    budgetUsdSoft?: number;
  };
  health: Record<BridgeName, { available: boolean; authOk?: boolean }>;
  history?: Record<BridgeName, { successRate: number; p95LatencyMs?: number }>;
}
```

### 3.2.2 출력 계약
```ts
interface RoutingDecision {
  orderedBridges: BridgeName[];
  reasonCodes: string[];
  mode: 'explicit' | 'auto' | 'hybrid';
}
```

### 3.2.3 요구 동작
1. explicit selector(`codex` 등)는 해당 브리지만 선택한다.
2. `auto`는 unavailable/auth failed 브리지를 제외한다.
3. `hybrid` debate는 최소 2개 서로 다른 브리지를 반환한다.
4. fallback 목록이 주어지면 auto 결과 뒤에 덧붙이되 중복 제거한다.

## 3.3 Fallback Executor

### 3.3.1 실행 규칙
1. 브리지별 최대 시도 횟수는 `maxRetriesPerBridge` 이하.
2. retryable error만 내부 재시도 가능.
3. non-retryable error는 즉시 다음 브리지로 이동.
4. 전체 실패 시 aggregated error를 반환한다.

### 3.3.2 표준 에러 객체
```ts
interface BridgeExecutionError {
  code: BridgeErrorCode;
  bridge: BridgeName;
  message: string;
  retryable: boolean;
  cause?: unknown;
}
```

## 3.4 Session/DB 계층

### 3.4.1 세션 컬럼
1. `thread_claude TEXT NULL`
2. `thread_codex TEXT NULL`
3. `thread_gemini TEXT NULL`
4. `active_bridge TEXT NULL`

### 3.4.2 이벤트 컬럼
1. `bridge TEXT NOT NULL DEFAULT 'codex'`
2. `attempt_no INTEGER NOT NULL DEFAULT 1`
3. `fallback_from TEXT NULL`
4. `error_code TEXT NULL`
5. `routing_reason TEXT NULL`

### 3.4.3 하위호환 규칙
1. legacy `codex_thread_id` 읽기 지원
2. 읽기 시 `thread_codex`가 null이면 legacy 값을 매핑
3. 쓰기 시 신규 컬럼과 legacy 컬럼을 동기화

## 3.5 MCP Schema 계층

### 3.5.1 공통 확장 필드
1. `model_selector?: 'auto' | 'claude' | 'codex' | 'gemini' | 'hybrid'`
2. `fallback?: Array<'claude' | 'codex' | 'gemini'>`
3. `routing_policy?: 'default' | 'quality_first' | 'speed_first' | 'cost_first'`
4. `constraints?: { max_latency_ms?: number; max_retries_per_bridge?: number; budget_usd_soft?: number }`

### 3.5.2 검증 규칙
1. `fallback` 중복 금지
2. `debate` + `hybrid`일 때 participants 최소 2개
3. 동일 브리지 중복 participants 금지

## 3.6 Normalizer 계층

### 3.6.1 결과 정규화 계약
```ts
interface NormalizedResult {
  bridge: BridgeName;
  model?: string;
  text: string;
  findings: Array<{
    severity: 'high' | 'medium' | 'low';
    file?: string;
    line?: number;
    message: string;
    suggestion?: string;
  }>;
  verdict?: 'approved' | 'needs_revision' | 'blocked';
  score?: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  latencyMs: number;
  sessionId?: string;
  parserWarnings?: string[];
}
```

### 3.6.2 파서 정책
1. 파싱 실패해도 `text`는 항상 보존한다.
2. 부분 파싱 실패는 `parserWarnings`에 기록한다.

## 4. 보안 요구사항
1. 허용되지 않은 실행 command는 즉시 차단(`VALIDATION_ERROR`)
2. 경로 이탈 차단(프로젝트 루트 밖 실행 금지)
3. DLP sanitize 후 외부 브리지 호출
4. stderr/log에 민감정보 원문 저장 금지

## 5. 관측 가능성 요구사항

### 5.1 필수 로그 필드
1. `request_id`
2. `tool_name`
3. `bridge`
4. `attempt_no`
5. `fallback_from`
6. `error_code`
7. `latency_ms`
8. `token_usage`
9. `session_before`
10. `session_after`

### 5.2 메트릭
1. `bridge_call_total{bridge,status}`
2. `bridge_latency_ms{bridge,command}`
3. `fallback_total{from,to,reason}`
4. `routing_selected_total{bridge,command,policy}`

## 6. 테스트 기술 요구사항

## 6.1 단위 테스트 최소 세트
1. routing scorer 계산
2. selector explicit/auto/hybrid
3. fallback executor 분기
4. bridge error mapping
5. normalizer 파싱
6. session read/write(legacy 호환 포함)

## 6.2 통합 테스트 최소 세트
1. review(auto) -> primary success
2. review(auto) -> primary timeout -> fallback success
3. debate(hybrid) -> same bridge reject
4. debate(hybrid) -> two bridge success

## 6.3 E2E 최소 세트
1. MCP `multimcp_review` contract
2. MCP `multimcp_debate` hybrid validation
3. `doctor` 3-bridge status output
4. `@multimcp/mcp-server` build + full e2e(`test:e2e`) pass
5. MCP 서버 기동 시 `.cowork/db` 부트스트랩 경로 검증

## 7. 성능/신뢰성 목표
1. 라우팅 결정 p95 < 300ms
2. review(auto) 성공률 >= 95%
3. 폴백 성공률 >= 70%
4. debate validation false positive 0%

## 8. 구현 마일스톤 (M0/M1 중심)

### M0 목표
1. 베이스라인 사실 정합 문서화
2. debate 회귀 체크리스트 확보
3. 용어 정렬(PRD/TRD/TASKS)

### M1 목표
1. 브리지 인터페이스 도입
2. Codex adapter 캡슐화(동작 동일)
3. Claude/Gemini adapter 초기 동작
4. 라우터+폴백 기본 구현
5. 세션/이벤트 스키마 확장
6. MCP schema 기본 확장
7. 기본 테스트 green

### M1 산출물
1. 코드
2. migration
3. 테스트
4. 문서(PRD/TRD/M1_TASKS)

## 9. 리스크와 기술 대응
1. CLI 출력 포맷 변동
- 대응: adapter별 parser 분리, parser version pinning

2. 브리지 인증 실패
- 대응: healthCheck 결과를 router exclusion에 반영

3. 마이그레이션 실패
- 대응: transaction + backup + rollback path

4. fallback 루프
- 대응: bridge별 시도 횟수 제한 및 visited set 사용

## 10. 구현 규칙
1. feature flag로 단계적 활성화
2. 기존 codex 우선 경로를 완전히 삭제하지 않고 compat bridge로 유지
3. 새 모듈은 strict type + unit test 동반
4. merge 조건: AC 충족 + 테스트 패스 + 문서 업데이트

## 11. 완료 정의 (Technical DoD)
1. 브리지 3종 adapter가 컴파일/헬스체크 가능
2. review 경로에서 auto/fallback 동작
3. debate hybrid 검증 동작
4. 세션/이벤트 신규 필드 저장 확인
5. 단위/통합 테스트 모두 pass
6. `docs/M1_TASKS.md` 상태 표기와 TRD 상태 문구가 일치
