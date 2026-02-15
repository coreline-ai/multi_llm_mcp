import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ensureBootstrapDb } from "../src/bootstrap.js";

describe("ensureBootstrapDb", () => {
  const previousProjectDir = process.env.MULTIMCP_PROJECT_DIR;

  afterEach(() => {
    if (previousProjectDir === undefined) {
      process.env.MULTIMCP_PROJECT_DIR = undefined;
    } else {
      process.env.MULTIMCP_PROJECT_DIR = previousProjectDir;
    }
  });

  it("creates .cowork/db under project dir", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "multimcp-"));
    process.env.MULTIMCP_PROJECT_DIR = tempDir;

    const dbDir = ensureBootstrapDb();

    expect(dbDir).toBe(path.join(tempDir, ".cowork", "db"));
    expect(fs.existsSync(dbDir)).toBe(true);
  });
});
