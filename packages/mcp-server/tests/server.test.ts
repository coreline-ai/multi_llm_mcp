import { describe, expect, it } from "vitest";

import { MultiMcpServer } from "../src/server.js";

describe("MultiMcpServer", () => {
  it("lists expected tools", () => {
    const server = new MultiMcpServer();
    expect(server.listTools()).toEqual([
      "multimcp_review",
      "multimcp_plan",
      "multimcp_fix",
      "multimcp_debate",
      "multimcp_memory",
      "multimcp_cost",
    ]);
  });

  it("returns normalized result for debate", async () => {
    const server = new MultiMcpServer();
    const result = await server.callTool({
      tool: "multimcp_debate",
      input: {
        model_selector: "hybrid",
        question: "Should we adopt CQRS?",
        participants: ["claude", "codex"],
      },
    });

    expect(result.status).toBe("success");
    expect(result.responses).toHaveLength(2);
    expect(result.totalTokenUsage.totalTokens).toBeGreaterThan(0);
  });
});
