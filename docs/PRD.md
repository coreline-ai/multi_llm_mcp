# PRD: Multi-Bridge MCP Orchestrator (MultiMCP v2)

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 0. 문서 메타
- 문서 버전: `v1.2`
- 작성일: `2026-02-14`
- 상태: `Planning Baseline (Task-Driven)`
- 기준 문서: `docs/IMPLEMENTATION_GOAL.md`
- 목표 릴리스: `v2.0.0`

## 0.1 M1 목표 상태 (2026-02-14 기준)
1. Bridge 타입/레지스트리/adapter(codex, claude, gemini) 구현 목표
2. routing selector/scorer/policy/fallback 구현 목표
3. session/event/message 스키마 확장 및 하위호환 migration 목표
4. MCP schema + orchestrator routing/fallback 연동 목표
5. 품질 게이트 기준(`lint`, `typecheck`, `test`) 충족 목표

## 0.2 문서 정합 원칙 (2026-02-15)
1. 진행 상태는 `docs/M0_TASKS.md`~`docs/M5_TASKS.md` 체크박스를 단일 기준으로 사용
2. 본 PRD/TRD/TASKS_INDEX 상태 표기는 체크박스 상태와 동일하게 유지
3. 릴리스 전 품질 게이트 명령(`lint`, `typecheck`, `test`)은 문서 간 동일하게 유지

## 1. 제품 개요

### 1.1 한 줄 정의
MultiMCP v2는 MCP 요청을 Claude Code CLI, Codex CLI, Gemini CLI로 동적으로 라우팅하고, 실패 시 자동 폴백하며, 브리지별 세션/로그를 일관되게 관리하는 멀티-브리지 실행 플랫폼이다.

### 1.2 해결하려는 문제
현재 구조는 Codex 중심으로 하드코딩되어 있어 다음 문제가 있다.
1. `debate` 기능은 존재하지만, multimcp 내부는 codex 중심 결합이 강해 멀티 브리지 자동 선택/확장이 어렵다.
2. 특정 CLI 장애 시 전체 기능이 중단된다.
3. 브리지 선택 근거와 실행 이력이 불명확하다.

### 1.2.1 베이스라인 정합 (중요)
현재 baseline은 다음과 같다.
1. `multimcp debate`는 실제로 동작한다.
2. 자동 토론 오케스트레이션(Claude 턴 생성)은 주로 외부 host(예: Claude Code skill)에서 수행된다.
3. multimcp는 GPT 호출/세션 재개/ledger 저장을 담당하는 debate backend 역할이다.

### 1.3 제품 가치
1. 가용성 향상: 한 CLI 실패 시 자동 폴백
2. 품질 향상: 작업 유형별 최적 브리지 선택
3. 신뢰성 향상: debate에서 서로 다른 브리지 강제
4. 운영성 향상: 표준화된 로깅/메트릭/에러 코드

## 2. 제품 목표 / 비목표

### 2.1 목표 (Goals)
1. MCP 전 툴(`review`, `plan`, `fix`, `debate`, `memory`, `cost`)이 `model_selector`를 지원한다.
2. `auto` 라우팅과 폴백 체인을 구현한다.
3. 브리지별 세션 ID를 저장/복원한다.
4. debate 시 서로 다른 브리지 2개 이상을 강제한다.
5. 운영에 필요한 진단(`doctor`)과 관측 가능성(로그/메트릭)을 제공한다.

### 2.2 비목표 (Non-Goals)
1. 웹 콘솔 구축
2. 벤더 API SDK 직접 호출 방식 전환
3. 완전 자동 비용 최적화/스케줄러

## 3. 사용자와 핵심 시나리오

### 3.1 대상 사용자
1. IDE에서 MCP를 통해 코드 리뷰를 받는 개발자
2. CLI 기반 자동화 워크플로우를 운영하는 팀
3. AI 협업 파이프라인(Plan-Review-Fix-Debate)을 구축하는 리드 엔지니어

### 3.2 핵심 시나리오
1. 사용자는 `review` 요청 시 `model_selector=auto`를 주고 최적 브리지 결과를 받는다.
2. 1순위 브리지 타임아웃 시 폴백 브리지가 자동 실행된다.
3. 사용자는 `debate` 요청 시 Claude vs Codex 혹은 Codex vs Gemini처럼 상호 검토를 강제한다.
4. 긴 세션에서 브리지별 thread/session ID가 자동 재개된다.

## 4. 성공 지표 (Success Metrics)

### 4.1 기능 지표
1. MCP 주요 툴의 `model_selector` 적용률 100%
2. debate 요청 중 상호 브리지 강제 위반 0건

### 4.2 품질 지표
1. `review(auto)` 성공률 95% 이상
2. 폴백 성공률(1순위 실패 시) 70% 이상

### 4.3 성능 지표
1. quick review p95 120초 이내
2. 라우팅 의사결정 오버헤드 p95 300ms 이내

### 4.4 운영 지표
1. 에러 분류 누락률 1% 미만
2. 실행 로그에서 브리지/시도/폴백 추적률 100%

## 5. 기능 요구사항 (FR)

### FR-1. MCP 입력 모델 선택 지원
모든 주요 MCP 툴 입력에 아래 필드를 추가한다.

```json
{
  "model_selector": "auto | claude | codex | gemini | hybrid",
  "fallback": ["codex", "gemini"],
  "routing_policy": "default | quality_first | speed_first | cost_first",
  "constraints": {
    "max_latency_ms": 120000,
    "max_retries_per_bridge": 1,
    "budget_usd_soft": 2.0
  }
}
```

### FR-2. 브리지 공통 인터페이스

```ts
export type BridgeName = 'claude' | 'codex' | 'gemini';

export type BridgeErrorCode =
  | 'UNAVAILABLE'
  | 'AUTH'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'PARSE_ERROR'
  | 'TOOL_ERROR'
  | 'UNKNOWN';

export interface BridgeInput {
  command: 'review' | 'plan' | 'fix' | 'debate' | 'cleanup' | 'custom';
  prompt: string;
  cwd?: string;
  sessionId?: string;
  timeoutMs?: number;
}

export interface BridgeOutput {
  text: string;
  model?: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
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
    maxContextTokens?: number;
  };
}
```

### FR-3. Auto 라우팅
라우팅 엔진은 다음 입력으로 1순위 브리지를 선정한다.
1. 작업 타입 (`review`, `plan`, `fix`, `debate`)
2. 컨텍스트 크기 추정치
3. 브리지 헬스 상태
4. 최근 성공/실패 이력
5. 정책(`quality_first`, `speed_first`, `cost_first`)

출력:
1. 우선순위 리스트 (예: `["codex","gemini","claude"]`)
2. 선택 근거(`reason_codes`)

### FR-4. 폴백 체인 실행
1. 1순위 실패 시 즉시 에러 분류
2. 분류 결과가 폴백 허용이면 다음 브리지 실행
3. 동일 브리지 재시도는 최대 1회
4. 전체 체인 실패 시 집계 에러 반환

### FR-5. Debate 상호 검토 강제
1. `hybrid` 혹은 `auto` debate에서는 서로 다른 브리지 2개 이상 필수
2. 동일 브리지 중복 선택 시 요청 거부 (`VALIDATION_ERROR`)

### FR-6. 결과 정규화
브리지별 raw 응답을 `NormalizedResult`로 통일한다.

```ts
export interface Finding {
  severity: 'high' | 'medium' | 'low';
  file?: string;
  line?: number;
  code?: string;
  message: string;
  suggestion?: string;
}

export interface NormalizedResult {
  bridge: BridgeName;
  model?: string;
  text: string;
  findings: Finding[];
  verdict?: 'approved' | 'needs_revision' | 'blocked';
  score?: number;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  latencyMs: number;
  sessionId?: string;
  parserWarnings?: string[];
}
```

### FR-7. 세션 지속/복원
1. 세션은 브리지별 thread/session ID를 저장한다.
2. `resume` 가능한 브리지는 이전 세션 ID 재사용.
3. resume 실패 시 신규 세션으로 자동 전환하고 이벤트 기록.

### FR-8. 보안 요구
1. CLI 실행 명령 allowlist 적용
2. 경로 이탈 차단 (`cwd` must be inside project root)
3. 프롬프트 전송 전 민감정보 마스킹(DLP)

### FR-9. 관측 가능성
모든 실행 시 다음 필드를 이벤트에 기록한다.
1. `request_id`, `tool_name`, `bridge`, `attempt_no`
2. `fallback_from`, `error_code`, `latency_ms`
3. `token_usage`, `session_id_before`, `session_id_after`

### FR-10. 진단 명령 확장
`doctor`는 각 브리지별로 아래를 검사한다.
1. 실행 파일 존재
2. 버전 조회
3. 인증 스모크 테스트
4. 최소 기능(예: non-stream text generation) 확인

## 6. 비기능 요구사항 (NFR)

### NFR-1. 성능
1. 라우팅 결정 p95 < 300ms
2. 단일 브리지 호출 오버헤드 < 100ms (프롬프트 전처리 + 파싱 제외)

### NFR-2. 신뢰성
1. 하드 타임아웃 준수
2. 폴백 체인에서 장애 격리

### NFR-3. 유지보수성
1. 브리지 추가 시 수정 범위 최소화
2. 하드코딩된 특정 브리지 문자열 제거

### NFR-4. 호환성
1. 기존 MCP 도구명 유지
2. 스키마 확장은 backward compatible optional 필드로 시작

## 7. 정보 구조 / 시스템 설계

### 7.1 모듈 구조
1. Bridge module (`claude`, `codex`, `gemini`)
2. Routing module (`selector`, `policy`, `scorer`, `fallback`)
3. Normalizer module (`finding`, `verdict`, `usage`)
4. Session module (thread/session persistence, migration)
5. MCP tool module (tool schema + handler)
6. CLI command module (MCP validation surface)

### 7.2 권장 파일 레이아웃
```txt
core/bridges/
  base.ts
  claude-adapter.ts
  codex-adapter.ts
  gemini-adapter.ts
  registry.ts
  errors.ts

core/routing/
  selector.ts
  policy.ts
  scorer.ts
  fallback.ts

core/normalizers/
  index.ts
  finding-parser.ts
  verdict-parser.ts

core/session/
  session-store.ts
  migrations.ts

mcp-server/tools/
  review.ts
  plan.ts
  debate.ts
```

## 8. API 계약 (MCP Tool Contracts)

### 8.1 공통 요청 필드
```json
{
  "model_selector": "auto",
  "fallback": ["gemini", "claude"],
  "routing_policy": "quality_first",
  "constraints": {
    "max_latency_ms": 120000
  }
}
```

### 8.2 `multimcp_review`
요청:
```json
{
  "repoPath": "/workspace/project",
  "mode": "quick",
  "diff": "...",
  "model_selector": "auto",
  "fallback": ["gemini", "claude"]
}
```

응답:
```json
{
  "result": {
    "bridge": "codex",
    "model": "gpt-5.3-codex",
    "verdict": "needs_revision",
    "score": 7.5,
    "findings": [],
    "usage": { "inputTokens": 1200, "outputTokens": 650, "totalTokens": 1850 },
    "latencyMs": 18452
  },
  "routing": {
    "selected": "codex",
    "fallbackTried": ["gemini"],
    "reasonCodes": ["HEALTHY", "QUALITY_MATCH"]
  }
}
```

### 8.3 `multimcp_debate`
요청:
```json
{
  "question": "Should we adopt CQRS?",
  "model_selector": "hybrid",
  "participants": ["claude", "codex"],
  "maxRounds": 3
}
```

응답:
```json
{
  "status": "success",
  "responses": [
    {
      "model": "gpt-5-codex",
      "role": "codex-architect",
      "text": "의견 본문...",
      "tokenUsage": { "inputTokens": 220, "outputTokens": 90, "totalTokens": 310, "costUsd": 0 },
      "latencyMs": 12450,
      "meteringSource": "estimated"
    }
  ],
  "totalTokenUsage": { "inputTokens": 440, "outputTokens": 180, "totalTokens": 620, "costUsd": 0 },
  "partialFailure": false,
  "egressControl": "cli-managed"
}
```

검증 규칙:
1. `participants` 중복 금지
2. 길이 최소 2
3. 서로 다른 브리지 필수

## 9. 데이터 모델 / 스키마 변경

### 9.1 세션 테이블
신규 컬럼:
1. `thread_claude TEXT NULL`
2. `thread_codex TEXT NULL`
3. `thread_gemini TEXT NULL`
4. `active_bridge TEXT NULL`

### 9.2 이벤트 테이블
신규 컬럼:
1. `bridge TEXT NOT NULL DEFAULT 'codex'`
2. `attempt_no INTEGER NOT NULL DEFAULT 1`
3. `fallback_from TEXT NULL`
4. `error_code TEXT NULL`
5. `routing_reason TEXT NULL`

### 9.3 마이그레이션 SQL (예시)
```sql
ALTER TABLE multimcp_sessions ADD COLUMN thread_claude TEXT;
ALTER TABLE multimcp_sessions ADD COLUMN thread_codex TEXT;
ALTER TABLE multimcp_sessions ADD COLUMN thread_gemini TEXT;
ALTER TABLE multimcp_sessions ADD COLUMN active_bridge TEXT;

UPDATE multimcp_sessions
SET thread_codex = codex_thread_id
WHERE codex_thread_id IS NOT NULL;
```

## 10. 상태 전이 (State Machine)

### 10.1 실행 상태
`QUEUED -> ROUTING -> RUNNING -> SUCCESS`
`QUEUED -> ROUTING -> RUNNING -> FAILED -> FALLBACK_RUNNING -> SUCCESS|FAILED`

### 10.2 세션 상태
`NEW -> ACTIVE -> RESUME_FAILED -> ACTIVE_NEW_THREAD`

## 11. 에러 모델

### 11.1 표준 에러 응답
```json
{
  "error": {
    "code": "TIMEOUT",
    "bridge": "gemini",
    "message": "Execution exceeded 120000ms",
    "retryable": true
  }
}
```

### 11.2 에러 코드 정의
1. `VALIDATION_ERROR`
2. `UNAVAILABLE`
3. `AUTH`
4. `TIMEOUT`
5. `RATE_LIMIT`
6. `PARSE_ERROR`
7. `INTERNAL`

## 12. 라우팅 정책 상세

### 12.1 정책 타입
1. `default`: 균형
2. `quality_first`: 품질 가중치 상향
3. `speed_first`: 지연 가중치 상향
4. `cost_first`: 비용 가중치 상향

### 12.2 스코어 계산
```txt
score = wq*quality_fit + ws*speed_fit + wc*cost_fit + wh*health_fit + wr*recent_success
```

### 12.3 기본 가중치
1. default: `wq=0.30, ws=0.20, wc=0.10, wh=0.25, wr=0.15`
2. quality_first: `wq=0.45, ws=0.10, wc=0.05, wh=0.25, wr=0.15`
3. speed_first: `wq=0.20, ws=0.40, wc=0.10, wh=0.20, wr=0.10`
4. cost_first: `wq=0.20, ws=0.15, wc=0.35, wh=0.20, wr=0.10`

## 13. 구현 범위별 상세 요구사항

### 13.1 Core
1. 브리지 인터페이스 도입
2. registry/provider 일반화
3. 라우터 + 폴백 엔진
4. 정규화 파서
5. 세션 스토어 확장

### 13.2 MCP Server
1. 툴 입력 스키마 확장
2. 툴별 `model_selector` 반영
3. 라우팅 메타 포함 응답

### 13.3 CLI
1. `doctor` 멀티 CLI 진단
2. `review/fix/plan/debate` 명령에서 브리지 선택 옵션 노출
3. 오류 메시지에서 특정 CLI 명시 하드코딩 제거

## 14. 구현 티켓 분해 (Implementation Backlog)

### EPIC-A: Bridge Foundation
1. `A-01` BridgeAdapter 타입/에러 타입 정의
2. `A-02` CodexAdapter 분리(기존 기능 동일)
3. `A-03` ClaudeAdapter 스켈레톤 + healthCheck
4. `A-04` GeminiAdapter 스켈레톤 + healthCheck
5. `A-05` BridgeRegistry 구현

### EPIC-B: Routing
1. `B-01` RoutingInput/Output 타입 정의
2. `B-02` scorer 구현
3. `B-03` policy 구현
4. `B-04` fallback executor 구현
5. `B-05` 라우팅 근거(reason codes) 기록

### EPIC-C: MCP Integration
1. `C-01` tool schema 확장(`model_selector`, `fallback`)
2. `C-02` orchestrator 라우팅 연동
3. `C-03` 응답에 routing 메타 추가
4. `C-04` debate participants 검증

### EPIC-D: Session & DB
1. `D-01` migration 추가
2. `D-02` 세션 read/write API 확장
3. `D-03` 하위호환 로직(legacy codex_thread_id) 유지
4. `D-04` 이벤트 스키마 확장

### EPIC-E: Observability & Tooling
1. `E-01` 표준 로그 필드 통일
2. `E-02` doctor 멀티 CLI 진단
3. `E-03` 라우팅/폴백 메트릭 출력

### EPIC-F: Tests
1. `F-01` unit: scorer/policy/fallback
2. `F-02` integration: review auto/fallback
3. `F-03` integration: debate hybrid validation
4. `F-04` e2e: mcp tool contracts

## 15. 수용 기준 (Acceptance Criteria)

### AC-1. Review Auto Routing
1. Given `model_selector=auto`
2. When `multimcp_review` 호출
3. Then 응답에 `routing.selected`가 포함된다.

### AC-2. Fallback
1. Given 1순위 브리지 timeout
2. When fallback 목록이 존재
3. Then 2순위 브리지가 실행되고 결과가 반환된다.

### AC-3. Debate Integrity
1. Given `participants=["codex","codex"]`
2. When `multimcp_debate` 호출
3. Then `VALIDATION_ERROR`가 반환된다.

### AC-4. Session Persistence
1. Given 이전 실행에서 `thread_gemini` 저장
2. When 동일 세션 재실행
3. Then `resume`가 우선 시도된다.

### AC-5. Doctor
1. Given claude 미설치, codex 설치, gemini 설치
2. When `doctor` 실행
3. Then 3개 항목 상태가 분리 출력된다.

## 16. 테스트 전략

### 16.1 단위 테스트
1. 정책별 스코어 계산 정확성
2. 폴백 조건 분기
3. 에러 코드 매핑
4. 결과 정규화 파서

### 16.2 통합 테스트
1. 브리지 헬스체크 기반 auto 제외
2. review -> fallback -> success
3. debate hybrid validation

### 16.3 회귀 테스트
1. 기존 codex 우선 설정이 그대로 동작
2. 기존 MCP tool 이름/응답 주요 필드 유지

## 17. 롤아웃 계획

### 17.1 단계적 배포
1. Phase 1: CodexAdapter 캡슐화 + 내부 인터페이스 도입 (동작 동일)
2. Phase 2: Claude/Gemini adapter 추가, auto 비활성(플래그)
3. Phase 3: auto/fallback 활성화
4. Phase 4: debate 하이브리드 강제 활성화

### 17.2 Feature Flags
1. `MULTI_BRIDGE_ENABLED`
2. `AUTO_ROUTING_ENABLED`
3. `DEBATE_HYBRID_ENFORCED`

## 18. 리스크 및 대응
1. 리스크: 브리지별 출력 포맷 변동
   대응: adapter별 parser 버전 관리, parserWarnings 도입
2. 리스크: 인증 환경 차이
   대응: doctor 진단 결과를 라우팅 health에 반영
3. 리스크: 마이그레이션 실패
   대응: migration transaction + 롤백 경로 제공
4. 리스크: auto 라우팅 예측 실패
   대응: reason codes 저장 후 정책 튜닝 루프 구축

## 19. 운영 가이드 (초안)
1. 운영자는 배포 후 `doctor`를 먼저 실행한다.
2. 장애 시 로그에서 `request_id` 기준으로 브리지 시도 순서를 추적한다.
3. 지속 실패 브리지는 정책에서 일시 제외한다.

## 20. 개발 착수 체크리스트
1. [ ] 브랜치 생성: `feat/multibridge-foundation`
2. [ ] BridgeAdapter 타입 추가
3. [ ] CodexAdapter 이관
4. [ ] Session migration 추가
5. [ ] MCP schema 확장
6. [ ] unit test 기본 세트 추가
7. [ ] 문서(README + PRD 링크) 반영

## 21. 부록 A: 예시 `.cowork.yml` (v2)
```yaml
models:
  claude-architect:
    provider: anthropic
    model: claude-code-sonnet
    cliAdapter:
      command: claude
      args: ["code", "exec"]
      timeout: 180

  codex-reviewer:
    provider: openai
    model: gpt-5.3-codex
    cliAdapter:
      command: codex
      args: ["exec", "--skip-git-repo-check"]
      timeout: 180

  gemini-reviewer:
    provider: google
    model: gemini-2.5-pro
    cliAdapter:
      command: gemini
      args: ["-p"]
      timeout: 180

roles:
  architect:
    model: claude-architect
  reviewer:
    model: codex-reviewer
  reviewer_alt:
    model: gemini-reviewer

routing:
  defaultSelector: auto
  policy: quality_first
  fallbackOrder:
    review: ["codex", "gemini", "claude"]
    plan: ["claude", "codex", "gemini"]
    fix: ["codex", "claude", "gemini"]
    debate: ["claude", "codex", "gemini"]
```

운영 주의:
1. 계정/권한에 따라 `gpt-5.3-codex` 접근이 불가할 수 있다.
2. 해당 환경에서는 `gpt-5-codex` 대체 프로파일을 사용한다.

## 22. 부록 B: 구현 우선순위
1. 인터페이스/마이그레이션/호환성
2. review 경로 멀티 브리지화
3. debate 경로 강제 규칙
4. fix/plan/cleanup 확장
5. 운영 지표 및 튜닝
