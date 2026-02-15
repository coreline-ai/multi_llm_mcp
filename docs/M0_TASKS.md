# M0_TASKS.md

> [!NOTE]
> 이 문서는 MultiMCP 서비스(`@multimcp/mcp-server`) 중심 문서다.
> CLI 관련 표기는 MCP 서비스 기능 검증용 인터페이스 관점으로 해석한다.


## 0) 사용 규칙
1. 모든 태스크 시작 상태는 `[ ]`.
2. 구현 + 자체 검증 테스트 통과 후 `[x]`로 변경.
3. 완료 항목 끝에 `(완료)`를 추가.
4. 실패 시 체크 해제 후 원인/대응 기록.

## 1) M0 범위 (Baseline Alignment)
1. 현재 동작의 사실관계 고정
2. 회귀 방지 테스트 기반선 확보
3. 용어/요구사항 정렬(문서 동기화)
4. M1 진입 조건 확정

## 2) 선행 조건 체크
- [x] `M0-000-1` 문서/소스 위치 확인 (완료)
  - 구현 체크:
    - [x] 현재 리팩토링 대상은 `docs/*`와 신규 코드 베이스 기준임을 확인
    - [x] 레거시 분석 소스는 별도 아카이브 기준으로 고정
  - 자체 검증 테스트:
    - 명령: `ls -la docs`
    - 통과 기준: 문서 기준 경로 존재

- [x] `M0-000-2` 작업 브랜치 생성/워크스페이스 확인 (완료)
  - [x] 현재 워크스페이스는 비-git 저장소(`not-git`)로 브랜치 생성 절차 비적용 확인
  - 자체 검증 테스트:
    - 명령: `git rev-parse --is-inside-work-tree || echo not-git`
    - 통과 기준: `not-git` 또는 의도한 브랜치명 확인

## 3) Baseline Fact Lock Tasks

- [x] `M0-001` debate 실제 동작 경로 문서화 (완료)
  - 대상 파일:
    - `docs/BASELINE_ANALYSIS.md`
  - 구현 체크:
    - [x] `start -> turn -> persistence -> resume` 흐름 명시
    - [x] multimcp 내부/외부(Claude host) 경계 명시
  - 자체 검증 테스트:
    - 명령: `rg -n \"debate|resume|host|codex\" docs/BASELINE_ANALYSIS.md -S`
    - 통과 기준: 핵심 키워드 누락 없음

- [x] `M0-002` 용어 정의 고정 (완료)
  - 대상 파일:
    - `docs/PRD.md`
    - `docs/TRD.md`
  - 구현 체크:
    - [x] “debate 기능 존재”를 현재 상태로 명시
    - [x] “외부 오케스트레이터” 용어 추가
  - 자체 검증 테스트:
    - 명령: `rg -n \"baseline|외부 오케스트레이터|debate 기능\" docs/PRD.md docs/TRD.md -S`
    - 통과 기준: 용어 반영 확인

## 4) Regression Baseline Tasks

- [x] `M0-003` debate 회귀 테스트 체크리스트 작성 (완료)
  - 대상 파일:
    - `docs/M0_TASKS.md`
  - 구현 체크:
    - [x] `start/turn/status/history/complete` 기본 시나리오 정의
    - [x] resume success/failure 시나리오 정의
  - 자체 검증 테스트:
    - 명령: `rg -n \"start|turn|status|history|complete|resume\" docs/M0_TASKS.md -S`
    - 통과 기준: 모든 핵심 시나리오 포함

- [x] `M0-004` 기존 dogfood 이슈 반영 목록 생성 (완료)
  - 대상 파일:
    - `docs/M0_TASKS.md`
  - 구현 체크:
    - [x] 레거시 DOGFOOD 고위험 fix 목록 요약
    - [x] 리팩토링 시 재발 방지 항목 매핑
  - 자체 검증 테스트:
    - 명령: `rg -n \"HIGH|race|dedupe|timeout|session\" docs/M0_TASKS.md -S`
    - 통과 기준: 고위험 항목 키워드 매핑 확인

### 4.1 Debate 회귀 체크리스트 (M0 기준선)
1. `debate start` 정상 생성
- 입력: 유효 topic, `--max-rounds` 기본값
- 기대: `debateId` 반환, `debate_turns` proposer/critic row 생성
2. `debate turn` 기본 턴 실행
- 입력: 유효 `debateId`, 일반 프롬프트
- 기대: `debate_messages`에 queued->running->completed 전이
3. `debate turn` 멱등성
- 입력: 같은 `(debate_id, round, role)` 재호출
- 기대: 중복 실행 대신 캐시 응답 반환
4. `debate status` 조회
- 입력: 유효 `debateId`
- 기대: round/participants/tokenBudget 출력
5. `debate history` 조회
- 입력: 유효 `debateId`
- 기대: message list + token budget 출력
6. `debate complete` 종료
- 입력: 유효 `debateId`
- 기대: proposer/critic 모두 completed
7. resume 성공 시나리오
- 조건: 동일 sessionId 유지 가능한 상태
- 기대: `resumed=true` 또는 동일 thread 지속
8. resume 실패 fallback 시나리오
- 조건: stale session 또는 resume 실패 유도
- 기대: fresh exec 또는 reconstruction prompt 경유 후 completed

### 4.2 DOGFOOD 고위험 이슈 재발 방지 매핑
1. Job queue race (HIGH)
- 재발 방지: 상태 전이 조건부 업데이트 테스트 유지
- 연결 단계: M2, M3
2. Watch dedupe key mismatch (HIGH)
- 재발 방지: dedupe key 규약 테스트
- 연결 단계: M3
3. Directory input not expanded (HIGH)
- 재발 방지: review 입력 정규화 테스트
- 연결 단계: M2
4. No codex installed confusing error (HIGH)
- 재발 방지: doctor/health check 표준 오류
- 연결 단계: M2
5. Debate/session resume 회귀 위험
- 재발 방지: debate resume success/failure integration 테스트
- 연결 단계: M1, M3, M4

## 5) M1 진입 게이트 정리

- [x] `M0-005` M1 게이트 업데이트 (완료)
  - 대상 파일:
    - `docs/TASKS_INDEX.md`
    - `docs/M1_TASKS.md`
  - 구현 체크:
    - [x] M1 전에 M0 완료가 선행임을 명시
    - [x] M1에 debate 회귀 테스트 항목 연결
  - 자체 검증 테스트:
    - 명령: `rg -n \"M0|진입 조건|회귀\" docs/TASKS_INDEX.md docs/M1_TASKS.md -S`
    - 통과 기준: M0 선행 조건 표기 확인

## 6) Quality Gate

- [x] `M0-006` 문서 정합성 점검 (완료)
  - 자체 검증 테스트:
    - 명령: `rg -n \"토론 기능 부재|debate 없음|내장돼 있지\" docs --glob \"*.md\" --glob \"!M0_TASKS.md\" -S`
    - 통과 기준: 오해를 유발하는 표현 제거 또는 맥락화

- [x] `M0-007` 완료 보고 업데이트 (완료)
  - 구현 체크:
    - [x] 본 문서 완료 항목에 `[x]` 반영
    - [x] 보류 항목 없음
  - 자체 검증 테스트:
    - 명령: `rg -n \"\\[ \\] M0-\" docs/M0_TASKS.md`
    - 통과 기준: 남은 미완료 항목이 실제 보류와 일치

## 7) 진행 기록 템플릿
```md
### M0-XXX 진행 기록
- 상태: [ ] 진행중 / [x] 완료
- 구현 요약:
- 자체 검증 테스트:
  - 명령:
  - 결과:
- 이슈:
- 다음 액션:
```
