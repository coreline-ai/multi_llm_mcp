# Contributing to MultiMCP

Thanks for contributing. This repository is maintained with a **Codex MCP service-first** approach.

## Contribution Priorities

1. MCP tool contracts and handler behavior (`mcp-server` module)
2. Core orchestration/routing/security (`core` module)
3. Documentation and operational runbooks (`docs/`)
4. CLI changes (`cli` module) should focus on MCP feature validation paths

## Prerequisites

- Node.js >= 22
- `pnpm` >= 9 (`corepack enable` recommended)
- At least one bridge runtime for end-to-end scenarios:
  - Codex CLI
  - Claude Code CLI
  - Gemini CLI

## Getting Started

```bash
git clone https://github.com/katarmal-ram/multimcp.git
cd multimcp
corepack pnpm install
corepack pnpm build
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
```

## Project Structure

```txt
packages/
  core/           # Orchestration, routing, bridge abstraction
  mcp-server/     # MCP tool contract and stdio server entry
  cli/            # `multimcp doctor` and helper CLI surface
  web/            # Placeholder package
docs/             # PRD/TRD/tasks/runbook
README.md
CONTRIBUTING.md
SECURITY.md
```

## Development Workflow

1. Branch from `master`
2. Implement changes with tests first
3. Run quality gates before PR
4. Keep changes scoped to one intent per PR

Quality gate command:

```bash
corepack pnpm build && corepack pnpm typecheck && corepack pnpm test && corepack pnpm lint
```

## Testing

```bash
# Full workspace
corepack pnpm test

# MCP service focused
corepack pnpm --filter @multimcp/mcp-server test
corepack pnpm --filter @multimcp/mcp-server test:e2e

# Core behavior
corepack pnpm --filter @multimcp/core test
```

Main test locations:

- `packages/mcp-server/tests/`
- `packages/core/tests/`
- `packages/cli/tests/`

## Adding or Updating an MCP Tool

1. Define/adjust schema and handler in the MCP server tool layer
2. Integrate orchestration call path through `@multimcp/core`
3. Add contract tests in `packages/mcp-server/tests/`
4. Verify response stability with `test:e2e`

## Adding a New Bridge Runtime

1. Implement adapter in `packages/core/src/bridges/`
2. Register in bridge registry
3. Update types/schema in `packages/core/src/types.ts` and routing/orchestrator paths
4. Add routing and fallback tests
5. Validate MCP tool behavior remains backward compatible

## Code Style

- TypeScript strict mode + ESM
- Biome for lint/format (`corepack pnpm lint`, `corepack pnpm lint:fix`)
- Avoid `any`; prefer precise types
- Prefer explicit constants over magic values

## Commit Messages

Use conventional commits:

```txt
feat: add mcp review tool routing metadata
fix: guard invalid repo path in mcp review handler
docs: align prd with mcp-service-first scope
test: add fallback integration case for mcp debate
```

## Reporting Issues

- Use GitHub Issues for bugs/features
- Include repro steps, expected/actual, environment info
- For vulnerabilities, use [SECURITY.md](SECURITY.md)

## License

By contributing, you agree contributions are licensed under MIT.
