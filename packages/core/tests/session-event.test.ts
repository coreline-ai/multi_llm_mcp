import { describe, expect, it } from "vitest";

import { Orchestrator } from "../src/index.js";

describe("session and event tracking", () => {
  it("stores session thread and execution events", async () => {
    const orchestrator = new Orchestrator();

    const result = await orchestrator.execute("review", {
      model_selector: "auto",
      prompt: "review tracking",
      session_id: "session-1",
    });

    const session = orchestrator.getSessionStore().get("session-1");
    expect(result.requestId.length).toBeGreaterThan(8);
    expect(session?.active_bridge).toBe(result.responses[0]?.bridge);

    const events = orchestrator.getEventStore().listByRequest(result.requestId);
    expect(events.length).toBeGreaterThan(1);
    expect(events.some((event) => event.status === "success")).toBe(true);
  });

  it("keeps legacy codex thread compatibility accessor", async () => {
    const orchestrator = new Orchestrator();

    await orchestrator.execute("review", {
      model_selector: "codex",
      prompt: "legacy session",
      session_id: "session-legacy",
    });

    const legacy = orchestrator.getSessionStore().getLegacyCodexThreadId("session-legacy");
    expect(legacy?.startsWith("codex_")).toBe(true);
  });

  it("uses resume path when thread exists", async () => {
    const orchestrator = new Orchestrator();

    await orchestrator.execute("review", {
      model_selector: "codex",
      prompt: "first turn",
      session_id: "session-resume",
    });

    const second = await orchestrator.execute("review", {
      model_selector: "codex",
      prompt: "second turn",
      session_id: "session-resume",
    });

    expect(second.responses[0]?.text).toContain("[resume:");
  });
});
