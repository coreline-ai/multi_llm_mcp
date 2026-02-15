import { describe, expect, it } from "vitest";

import type { BridgeAdapter } from "../src/bridges/adapter.js";
import { BridgeRegistry } from "../src/bridges/registry.js";

const healthyAdapter: BridgeAdapter = {
  name: "codex",
  model: "x",
  async healthCheck() {
    return true;
  },
  async send(_input) {
    return { text: "ok", inputTokens: 1, outputTokens: 1, latencyMs: 1 };
  },
  async resume(_threadId, _input) {
    return { text: "ok", inputTokens: 1, outputTokens: 1, latencyMs: 1 };
  },
};

const unhealthyAdapter: BridgeAdapter = {
  name: "claude",
  model: "y",
  async healthCheck() {
    return false;
  },
  async send(_input) {
    return { text: "ok", inputTokens: 1, outputTokens: 1, latencyMs: 1 };
  },
  async resume(_threadId, _input) {
    return { text: "ok", inputTokens: 1, outputTokens: 1, latencyMs: 1 };
  },
};

const geminiAdapter: BridgeAdapter = {
  name: "gemini",
  model: "z",
  async healthCheck() {
    return true;
  },
  async send(_input) {
    return { text: "ok", inputTokens: 1, outputTokens: 1, latencyMs: 1 };
  },
  async resume(_threadId, _input) {
    return { text: "ok", inputTokens: 1, outputTokens: 1, latencyMs: 1 };
  },
};

describe("BridgeRegistry", () => {
  it("returns health snapshot", async () => {
    const registry = new BridgeRegistry({
      codex: healthyAdapter,
      claude: unhealthyAdapter,
      gemini: geminiAdapter,
    });

    const health = await registry.healthSnapshot();
    expect(health.codex).toBe(true);
    expect(health.claude).toBe(false);
    expect(health.gemini).toBe(true);
  });
});
