# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.2.x   | Yes       |
| < 0.2   | No        |

## Reporting a Vulnerability

If you discover a vulnerability in MultiMCP:

1. Do not open a public issue
2. Use GitHub private vulnerability reporting for this repository
3. Include impact, repro steps, and affected scope

## Response Timeline

- Acknowledgment: within 48 hours
- Assessment: within 1 week
- Fix: based on severity, usually within 2 weeks

## Security Architecture (MCP Service Focus)

MultiMCP is operated as a local MCP service with bridge runtime execution.

### Credentials Boundary

- MultiMCP does not issue or manage external model credentials
- Bridge runtimes (Codex/Claude/Gemini CLI) handle their own auth
- Service only invokes approved bridge commands

### Data Locality

- Session/memory/event data is stored in local SQLite (`.cowork/db`)
- No built-in telemetry collection
- No direct model API SDK calls from MultiMCP core flow

### Input and Execution Controls

- Path traversal prevention with project-root boundary checks
- Parameterized SQL to mitigate injection risk
- Command allowlist and validated argument handling
- Retry/error classification paths are normalized for predictable fallback

### DLP and Policy Layers

- DLP redaction pipeline for sensitive token/secret patterns
- Policy engine can block risky workflows (for example, critical findings)
- Cleanup/security scans can be enforced via workflow policy

## Known Constraints

- SQLite is not encrypted at rest by default
- Bridge runtime behavior can vary by upstream version
- Operator-level shell permissions still apply to local execution contexts
- Regex-based security scanning is not a full SAST replacement
