import { performance } from "node:perf_hooks";

import { describe, expect, it } from "vitest";

import { Orchestrator } from "../src/index.js";

describe("performance smoke", () => {
  it("completes quick review within local threshold", async () => {
    const orchestrator = new Orchestrator();
    const startedAt = performance.now();

    await orchestrator.execute("review", {
      model_selector: "auto",
      prompt: "quick review smoke",
    });

    const elapsedMs = performance.now() - startedAt;
    expect(elapsedMs).toBeLessThan(500);
  });
});
