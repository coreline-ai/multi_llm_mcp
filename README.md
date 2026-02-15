# 🌉 MultiMCP v2

[![CI](https://github.com/katarmal-ram/multimcp/actions/workflows/ci.yml/badge.svg)](https://github.com/katarmal-ram/multimcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Beta](https://img.shields.io/badge/Status-Beta-yellow)](https://github.com/katarmal-ram/multimcp)

> **MCP를 위한 멀티-브리지 오케스트레이터.**  
> 코드 리뷰, 계획, 디버깅 작업을 **Claude**, **Codex**, **Gemini** CLI로 매끄럽게 라우팅합니다.

---

## 🚀 개요

**MultiMCP**는 **지능형 오케스트레이터** 역할을 하는 MCP(Model Context Protocol) 서버입니다. 단일 LLM에 의존하는 대신, 역량, 비용, 성능을 고려하여 가장 적합한 CLI 도구로 작업을 동적으로 라우팅합니다.

### 왜 MultiMCP인가요?
- **멀티-모델 인텔리전스**: Claude의 추론 능력, Codex의 코딩 전문성, Gemini의 속도를 결합합니다.
- **회복 탄력성(Resilience)**: 자동 폴백(Fallback) 기능으로 하나의 제공자가 다운되어도 요청이 성공하도록 보장합니다.
- **비용 효율성**: 작업 복잡도에 기반한 지능형 라우팅(예: 간단한 수정에는 더 가벼운 모델 사용)을 제공합니다.

---

## 🏗️ 아키텍처

MultiMCP는 기본 CLI 도구들을 추상화하는 핵심 오케스트레이션 계층을 가진 모노레포로 구성되어 있습니다.

```mermaid
graph TD
    Client[MCP Client (Claude/IDE)] --> Server[MCP Server]
    Server --> Orchestrator[Orchestrator Layer]
    
    subgraph Core Logic
        Orchestrator --> Router[Auto Router]
        Orchestrator --> Fallback[Fallback Executor]
        Orchestrator --> Session[Session Manager]
    end
    
    subgraph Bridge Adapters
        Router --> Claude[Claude Adapter]
        Router --> Codex[Codex Adapter]
        Router --> Gemini[Gemini Adapter]
    end
    
    Claude --> CLI1[Claude Code CLI]
    Codex --> CLI2[Codex CLI]
    Gemini --> CLI3[Gemini CLI]
```

## ✨ 주요 기능

| 기능 | 상태 | 설명 |
| :--- | :--- | :--- |
| **멀티-브리지 지원** | ✅ 완료 | `codex`, `claude`, `gemini`를 위한 네이티브 어댑터. |
| **자동 라우팅 (Auto-Routing)** | ✅ 완료 | `quality`, `speed`, `cost` 프로필에 기반한 똑똑한 선택. |
| **폴백 시스템** | ✅ 완료 | 자동 재시도 및 제공자 전환으로 높은 가용성 보장. |
| **토론 모드 (Debate Mode)** | ✅ 완료 | `hybrid` 모드는 서로 다른 모델이 상대방의 코드를 비평하도록 강제합니다. |
| **세션 지속성** | 🚧 예정 | 현재 구현은 인-메모리 방식이며, 영구 저장소로의 이전이 로드맵에 있습니다. |

---

## 🛠️ 사용법

### 필수 조건
- Node.js >= 22
- `pnpm` >= 9
- 설치된 CLI: `codex`, `claude`, 또는 `gemini` (최소 하나)

### 설치

MCP 설정 파일(예: `~/.config/Code/User/globalStorage/mcp-settings.json` 또는 `.mcp.json`)에 추가하세요:

```json
{
  "mcpServers": {
    "multimcp": {
      "command": "npx",
      "args": ["-y", "@multimcp/mcp-server"],
      "env": {
        "MULTIMCP_USE_REAL_BRIDGES": "1",
        "MULTIMCP_CLAUDE_MODEL": "claude-3-5-sonnet-20241022",
        "MULTIMCP_GEMINI_MODEL": "gemini-1.5-pro-latest"
      }
    }
  }
}
```

### 명칭 정책

- 제품/문서 브랜드명은 **MultiMCP**를 사용합니다.
- 기술 식별자는 모두 `multimcp` 네이밍으로 통일합니다.
- 패키지 스코프: `@multimcp/*`
- CLI 명령: `multimcp`
- MCP 툴명: `multimcp_*`

### 구성 (환경 변수)

환경 변수를 사용하여 브리지 동작을 구성할 수 있습니다:

| 변수 | 설명 | 기본값 |
| :--- | :--- | :--- |
| `MULTIMCP_USE_REAL_BRIDGES` | `1`로 설정하면 실제 CLI 실행을 활성화합니다. | `0` (Mock) |
| `MULTIMCP_CLAUDE_MODEL` | 사용할 특정 Claude 모델. | `claude-sonnet-4` |
| `MULTIMCP_GEMINI_MODEL` | 사용할 특정 Gemini 모델. | `gemini-2.5-flash-lite` |

---

## 📦 도구 (Tools)

MultiMCP는 다음 도구들을 MCP 클라이언트에 노출합니다:

- **`multimcp_review`**: 자동 라우팅을 포함한 코드 리뷰.
- **`multimcp_plan`**: 구현 계획 생성.
- **`multimcp_fix`**: 코드 수정 적용.
- **`multimcp_debate`**: 서로 다른 모델 간의 토론 진행.
- **`multimcp_memory`**: 공유 컨텍스트/메모리 접근.
- **`multimcp_cost`**: 토큰 사용량 및 예상 비용 추적.

---

## 🗺️ 로드맵 및 상태

- [x] **핵심 아키텍처**: 모노레포 설정, 오케스트레이터, 브리지 인터페이스.
- [x] **기본 어댑터**: Claude, Codex, Gemini 구현.
- [x] **라우팅 로직**: 점수 산정 및 선택 알고리즘.
- [ ] **세션 지속성**: 인-메모리에서 SQLite/파일 기반 저장소로 이동.
- [ ] **Doctor 명령어**: 설치 및 필수 조건 확인을 위한 CLI 도구.
- [ ] **관측 가능성 (Observability)**: 내보낼 수 있는 메트릭 및 로그.

---

## 📄 문서

- [구현 목표 (Implementation Goals)](docs/IMPLEMENTATION_GOAL.md)
- [릴리즈 요약 (Release Summary)](docs/RELEASE_SUMMARY.md)

---

## 라이선스

MIT © [MultiMCP Team](https://github.com/katarmal-ram/multimcp)
