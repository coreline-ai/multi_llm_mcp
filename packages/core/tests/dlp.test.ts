import { describe, expect, it } from "vitest";

import { sanitizePrompt } from "../src/security/dlp.js";

describe("sanitizePrompt", () => {
  it("redacts token-like secrets", () => {
    const result = sanitizePrompt("api_key=abcdef1234567890ABCDEFG");
    expect(result.redacted).toBe(true);
    expect(result.prompt).toContain("[REDACTED]");
  });

  it("truncates large prompt", () => {
    const large = "x".repeat(50);
    const result = sanitizePrompt(large, 20);
    expect(result.truncated).toBe(true);
    expect(result.prompt.endsWith("...[TRUNCATED]")).toBe(true);
  });
});
