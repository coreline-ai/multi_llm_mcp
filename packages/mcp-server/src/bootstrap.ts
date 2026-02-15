import fs from "node:fs";
import path from "node:path";

import { CoreError } from "@multimcp/core";

export function ensureBootstrapDb(): string {
  const projectDir = process.env.MULTIMCP_PROJECT_DIR ?? process.cwd();
  const dbDir = path.resolve(projectDir, ".cowork", "db");

  try {
    fs.mkdirSync(dbDir, { recursive: true });
    fs.accessSync(dbDir, fs.constants.R_OK | fs.constants.W_OK);
    return dbDir;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    throw new CoreError(
      "TOOL_ERROR",
      `failed to prepare .cowork/db at ${dbDir}. recovery: mkdir -p .cowork/db (${reason})`,
    );
  }
}
