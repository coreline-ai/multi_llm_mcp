import { afterEach, describe, expect, it } from "vitest";

import { resolveCodexModelByProfile } from "../src/bridges/mock-adapters.js";

describe("resolveCodexModelByProfile", () => {
  const previous = process.env.MULTIMCP_MODEL_PROFILE;

  afterEach(() => {
    if (previous === undefined) {
      process.env.MULTIMCP_MODEL_PROFILE = undefined;
    } else {
      process.env.MULTIMCP_MODEL_PROFILE = previous;
    }
  });

  it("uses default model profile", () => {
    process.env.MULTIMCP_MODEL_PROFILE = undefined;
    expect(resolveCodexModelByProfile()).toBe("gpt-5.3-codex");
  });

  it("uses compat model profile", () => {
    process.env.MULTIMCP_MODEL_PROFILE = "compat";
    expect(resolveCodexModelByProfile()).toBe("gpt-5-codex");
  });
});
