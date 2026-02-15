import { describe, expect, it } from "vitest";

import { scoreBridges } from "../src/routing/scorer.js";

describe("scoreBridges", () => {
  it("prioritizes codex for review by default", () => {
    const scored = scoreBridges({
      command: "review",
      policy: "default",
      health: { codex: true, claude: true, gemini: true },
      candidates: ["codex", "claude", "gemini"],
    });

    expect(scored[0]?.bridge).toBe("codex");
  });

  it("demotes unhealthy bridge", () => {
    const scored = scoreBridges({
      command: "review",
      policy: "quality_first",
      health: { codex: false, claude: true, gemini: true },
      candidates: ["codex", "claude", "gemini"],
    });

    expect(scored[0]?.bridge).not.toBe("codex");
  });
});
