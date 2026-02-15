import { describe, expect, it } from "vitest";

import { runDoctor } from "../src/index.js";

describe("runDoctor", () => {
  it("returns bridge status list", () => {
    const result = runDoctor();

    expect(result.bridges).toHaveLength(3);
    expect(result.bridges.map((entry) => entry.bridge)).toEqual(["codex", "claude", "gemini"]);
    expect(["ok", "degraded"]).toContain(result.status);
  });
});
