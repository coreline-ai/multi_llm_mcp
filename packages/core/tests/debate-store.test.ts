import { describe, expect, it } from "vitest";

import { InMemoryDebateStore } from "../src/debate/debate-store.js";

describe("InMemoryDebateStore", () => {
  it("starts and completes debate records", () => {
    const store = new InMemoryDebateStore();
    store.start("d1", "s1", ["claude", "codex"], 3);
    store.appendMessage("d1", {
      role: "claude",
      text: "message",
      round: 1,
      status: "completed",
    });
    store.complete("d1");

    const record = store.get("d1");
    expect(record?.status).toBe("completed");
    expect(record?.messages.length).toBe(1);
  });
});
