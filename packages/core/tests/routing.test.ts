import { describe, expect, it } from "vitest";

import { buildAttemptOrder } from "../src/routing/selector.js";

describe("buildAttemptOrder", () => {
  it("uses explicit bridge first", () => {
    const order = buildAttemptOrder({
      command: "review",
      selector: "gemini",
      fallback: ["codex", "claude"],
    });

    expect(order).toEqual(["gemini", "codex", "claude"]);
  });

  it("returns empty order for hybrid", () => {
    const order = buildAttemptOrder({
      command: "debate",
      selector: "hybrid",
    });

    expect(order).toEqual([]);
  });
});
