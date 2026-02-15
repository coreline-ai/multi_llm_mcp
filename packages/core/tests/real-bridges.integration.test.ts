import { describe, expect, it } from "vitest";

import { Orchestrator } from "../src/index.js";

const runRealBridgeE2E = process.env.MULTIMCP_REAL_BRIDGE_E2E === "1";
const describeReal = runRealBridgeE2E ? describe : describe.skip;
const TEST_TIMEOUT_MS = Number(process.env.MULTIMCP_REAL_BRIDGE_TEST_TIMEOUT_MS ?? 240_000);

describeReal("Orchestrator real bridge integration", () => {
  it(
    "falls back codex model to compat when primary model is unavailable",
    async () => {
      const previousCodexModel = process.env.MULTIMCP_CODEX_MODEL;
      const previousCodexFallbackModels = process.env.MULTIMCP_CODEX_FALLBACK_MODELS;

      process.env.MULTIMCP_CODEX_MODEL = "gpt-5.3-codex-unavailable-smoke";
      process.env.MULTIMCP_CODEX_FALLBACK_MODELS = "gpt-5-codex";

      try {
        const orchestrator = new Orchestrator();
        const result = await orchestrator.execute("review", {
          model_selector: "codex",
          fallback: ["codex"],
          prompt: "codex model fallback smoke. Reply with one short line.",
          constraints: {
            max_prompt_chars: 200,
          },
        });

        expect(result.status).toBe("success");
        expect(result.responses[0]?.bridge).toBe("codex");
        expect(result.responses[0]?.model).toBe("gpt-5-codex");
        expect(result.responses[0]?.text.length ?? 0).toBeGreaterThan(0);
      } finally {
        if (previousCodexModel === undefined) {
          process.env.MULTIMCP_CODEX_MODEL = undefined;
        } else {
          process.env.MULTIMCP_CODEX_MODEL = previousCodexModel;
        }
        if (previousCodexFallbackModels === undefined) {
          process.env.MULTIMCP_CODEX_FALLBACK_MODELS = undefined;
        } else {
          process.env.MULTIMCP_CODEX_FALLBACK_MODELS = previousCodexFallbackModels;
        }
      }
    },
    TEST_TIMEOUT_MS,
  );

  it(
    "executes review explicitly on codex/claude/gemini",
    async () => {
      const orchestrator = new Orchestrator();

      const bridges = ["codex", "claude", "gemini"] as const;
      for (const bridge of bridges) {
        const result = await orchestrator.execute("review", {
          model_selector: bridge,
          prompt: `integration smoke: ${bridge}. Reply with one short line.`,
          constraints: {
            max_prompt_chars: 300,
          },
        });

        expect(result.status).toBe("success");
        expect(result.responses[0]?.bridge).toBe(bridge);
        expect(result.responses[0]?.text.length ?? 0).toBeGreaterThan(0);
        expect(result.totalTokenUsage.totalTokens).toBeGreaterThan(0);
      }
    },
    TEST_TIMEOUT_MS,
  );

  it(
    "executes hybrid debate using all three bridges",
    async () => {
      const orchestrator = new Orchestrator();

      const result = await orchestrator.execute("debate", {
        model_selector: "hybrid",
        participants: ["claude", "codex", "gemini"],
        question: "Integration smoke debate. One short sentence each.",
        maxRounds: 1,
      });

      expect(result.status).toBe("success");
      expect(result.responses).toHaveLength(3);
      expect(result.routing.selected).toEqual(["claude", "codex", "gemini"]);
      expect(result.totalTokenUsage.totalTokens).toBeGreaterThan(0);
    },
    TEST_TIMEOUT_MS,
  );
});
