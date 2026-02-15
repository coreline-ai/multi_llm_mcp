import { describe, expect, it } from "vitest";

import { parseOptions, toToolInput } from "../src/command-options.js";

describe("command options", () => {
  it("parses selector and routing options for review", () => {
    const options = parseOptions([
      "--prompt",
      "review this",
      "--model-selector",
      "codex",
      "--routing-policy",
      "quality_first",
      "--fallback",
      "gemini,claude",
      "--max-latency-ms",
      "1200",
    ]);

    const input = toToolInput("review", options);
    expect(input.prompt).toBe("review this");
    expect(input.model_selector).toBe("codex");
    expect(input.routing_policy).toBe("quality_first");
    expect(input.fallback).toEqual(["gemini", "claude"]);
    expect(input.constraints?.max_latency_ms).toBe(1200);
  });

  it("parses debate specific options", () => {
    const options = parseOptions([
      "--question",
      "Should we split services?",
      "--participants",
      "claude,codex",
      "--max-rounds",
      "3",
      "--model-selector",
      "hybrid",
    ]);

    const input = toToolInput("debate", options);
    expect(input.question).toContain("split services");
    expect(input.participants).toEqual(["claude", "codex"]);
    expect(input.maxRounds).toBe(3);
    expect(input.model_selector).toBe("hybrid");
  });
});
