import { describe, expect, it } from "vitest";

import { MultiMcpServer } from "../src/server.js";

describe("mcp-server validation", () => {
  it("rejects unknown tool", async () => {
    const server = new MultiMcpServer();

    await expect(
      server.callTool({
        tool: "unknown_tool",
        input: { prompt: "hello" },
      }),
    ).rejects.toThrow(/unknown tool/);
  });

  it("rejects empty prompt", async () => {
    const server = new MultiMcpServer();

    await expect(
      server.callTool({
        tool: "multimcp_review",
        input: { prompt: "   " },
      }),
    ).rejects.toThrow(/prompt or question is required/);
  });
});
