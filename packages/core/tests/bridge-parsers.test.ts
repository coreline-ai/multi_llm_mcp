import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  parseClaudeJson,
  parseCodexJsonLines,
  parseGeminiJson,
} from "../src/bridges/real-cli-adapters.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.resolve(__dirname, "fixtures/bridge-parsers");

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixtureDir, name), "utf8");
}

describe("real CLI output parser contract", () => {
  it("parses codex JSONL output into text and token usage", () => {
    const parsed = parseCodexJsonLines(readFixture("codex.success.jsonl"));

    expect(parsed.text).toBe("codex parsed text");
    expect(parsed.inputTokens).toBe(111);
    expect(parsed.outputTokens).toBe(22);
  });

  it("falls back to raw codex text when JSON lines are unavailable", () => {
    const parsed = parseCodexJsonLines(readFixture("codex.nonjson.txt"));

    expect(parsed.text).toContain("final plain text output");
    expect(parsed.inputTokens).toBeUndefined();
    expect(parsed.outputTokens).toBeUndefined();
  });

  it("parses claude JSON output with usage fields", () => {
    const parsed = parseClaudeJson(readFixture("claude.success.json"));

    expect(parsed.text).toBe("claude parsed text");
    expect(parsed.inputTokens).toBe(345);
    expect(parsed.outputTokens).toBe(67);
  });

  it("parses claude output even with noisy prelude lines", () => {
    const parsed = parseClaudeJson(readFixture("claude.noise-and-json.txt"));

    expect(parsed.text).toBe("claude with noisy prelude");
    expect(parsed.inputTokens).toBe(12);
    expect(parsed.outputTokens).toBe(8);
  });

  it("parses gemini JSON output and aggregates token counters", () => {
    const parsed = parseGeminiJson(readFixture("gemini.success.json"));

    expect(parsed.text).toBe("gemini parsed text");
    expect(parsed.inputTokens).toBe(140);
    expect(parsed.outputTokens).toBe(12);
  });

  it("falls back to result text for gemini output without stats", () => {
    const parsed = parseGeminiJson(readFixture("gemini.no-stats.json"));

    expect(parsed.text).toBe("gemini fallback result");
    expect(parsed.inputTokens).toBeUndefined();
    expect(parsed.outputTokens).toBeUndefined();
  });
});
