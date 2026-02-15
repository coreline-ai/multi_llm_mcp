import { describe, expect, it } from "vitest";

import { CoreError, Orchestrator } from "../src/index.js";

describe("Orchestrator", () => {
  it("runs primary bridge on auto selector", async () => {
    const orchestrator = new Orchestrator();
    const result = await orchestrator.execute("review", {
      prompt: "review this diff",
      model_selector: "auto",
    });

    expect(result.requestId.length).toBeGreaterThan(8);
    expect(result.status).toBe("success");
    expect(result.responses[0]?.bridge).toBe("codex");
    expect(result.totalTokenUsage.totalTokens).toBeGreaterThan(0);
  });

  it("falls back when primary bridge fails", async () => {
    const orchestrator = new Orchestrator();
    const result = await orchestrator.execute("review", {
      prompt: "fail:codex trigger fallback",
      model_selector: "auto",
      fallback: ["gemini"],
    });

    expect(result.status).toBe("partial_failure");
    expect(result.responses[0]?.bridge).toBe("gemini");
    expect(result.partialFailure).toBe(true);
    expect(result.errors?.length).toBe(1);
  });

  it("enforces unique participants in hybrid debate", async () => {
    const orchestrator = new Orchestrator();

    await expect(
      orchestrator.execute("debate", {
        model_selector: "hybrid",
        participants: ["codex", "codex"],
      }),
    ).rejects.toBeInstanceOf(CoreError);
  });

  it("runs hybrid debate with two bridges", async () => {
    const orchestrator = new Orchestrator();
    const result = await orchestrator.execute("debate", {
      model_selector: "hybrid",
      question: "Should we adopt CQRS?",
      participants: ["claude", "codex"],
    });

    expect(result.status).toBe("success");
    expect(result.debateId?.startsWith("debate_")).toBe(true);
    expect(result.responses).toHaveLength(2);
    expect(result.routing.reasonCodes).toContain("HYBRID_ENFORCED");
  });

  it("marks DLP redaction and truncation reason codes", async () => {
    const orchestrator = new Orchestrator();
    const result = await orchestrator.execute("review", {
      model_selector: "codex",
      prompt: `api_key=abcdef1234567890ABCDEFG ${"long_text ".repeat(20)}`,
      constraints: { max_prompt_chars: 30 },
    });

    expect(result.routing.reasonCodes).toContain("DLP_REDACTED");
    expect(result.routing.reasonCodes).toContain("PROMPT_TRUNCATED");
  });
});
