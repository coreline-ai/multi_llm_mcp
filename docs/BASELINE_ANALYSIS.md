# BASELINE_ANALYSIS.md

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 1) 목적
이 문서는 리팩토링 전 현재 시스템의 **실제 동작 베이스라인**을 고정한다.  
핵심 목표는 “없는 기능을 만든다”가 아니라 “있는 기능을 깨지 않고 확장한다”로 정렬하는 것이다.

## 2) 현재 사실 (Code Reality)

### 2.1 Debate 기능 존재
`multimcp debate`는 실제로 동작한다.
1. 시작: `debate start`가 debate row/state를 생성
2. 턴 실행: `debate turn`이 입력 프롬프트를 GPT(Codex)로 호출
3. 저장: 메시지/세션/라운드 상태를 SQLite에 기록
4. 재개: session resume + 실패 시 재구성 프롬프트 fallback

근거 기준:
- debate start/turn/persistence/resume 동작 스냅샷
- SQLite 기반 message/debate 저장 흐름
- CLI adapter 기반 실행/재개 패턴

### 2.2 Claude의 현재 역할
현재 코드베이스에서 Claude는 `multimcp` 내부 브리지로 실행되지 않는다.
1. `multimcp` 내부 자동 실행은 codex 경로 중심
2. Claude는 외부 오케스트레이터(예: Claude Code + skill)로 턴을 생성/실행
3. 즉, “자동 토론”은 가능하지만 자동성의 주체는 host(Claude)다

### 2.3 현재 제약
1. provider schema가 사실상 openai/codex 중심
2. session/thread 저장 구조가 codex 중심
3. health check / doctor / command 설명이 codex 중심

## 3) 문제 재정의
기존 문제 정의를 다음처럼 정정한다.
1. Debate 기능 부재 문제가 아니다.
2. 문제는 “브리지 확장성 부족”과 “codex 중심 결합도”다.
3. 목표는 “기존 debate 안정성 유지 + 멀티 브리지 일반화”다.

## 4) 리팩토링 시 절대 보존해야 할 동작
1. `debate start/turn/status/history/complete` 커맨드 UX
2. session resume 및 stale recovery
3. JSON 출력 계약(자동화 의존)
4. ledger 기반 idempotency

## 5) 선행 권고 (M0)
M1 착수 전 아래를 먼저 수행한다.
1. Debate 회귀 테스트 스냅샷 고정
2. “외부 Claude 오케스트레이션”과 “내부 브리지 실행” 용어 분리
3. PRD/TRD/Tasks에 베이스라인 사실 반영

## 6) 결론
이번 프로젝트는 “토론 기능 신규 개발”이 아니라,  
“이미 동작하는 토론 백엔드를 멀티 브리지로 일반화하고 자동 라우팅을 도입하는 리팩토링”이다.
