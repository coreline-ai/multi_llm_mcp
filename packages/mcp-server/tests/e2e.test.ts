import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN_PATH = path.resolve(__dirname, "../dist/bin.js");

function onceLine(command: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.includes("\n")) {
        child.kill();
        resolve(stdout.trim());
      }
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code) => {
      if (!stdout && code !== 0) {
        reject(new Error(`bin exited with ${code}: ${stderr}`));
      }
    });

    child.stdin.write(`${JSON.stringify(command)}\n`);
  });
}

describe("mcp-server e2e", () => {
  it("lists tools via stdio protocol", async () => {
    const line = await onceLine({ action: "list_tools" });
    const parsed = JSON.parse(line) as { tools: string[] };

    expect(parsed.tools).toContain("multimcp_review");
    expect(parsed.tools).toContain("multimcp_debate");
  });

  it("executes review tool", async () => {
    const line = await onceLine({
      action: "call_tool",
      tool: "multimcp_review",
      input: {
        model_selector: "auto",
        prompt: "review this patch",
      },
    });

    const parsed = JSON.parse(line) as {
      status: string;
      responses: Array<{ bridge: string }>;
      totalTokenUsage: { totalTokens: number };
    };

    expect(parsed.status).toBe("success");
    expect(parsed.responses[0]?.bridge).toBe("codex");
    expect(parsed.totalTokenUsage.totalTokens).toBeGreaterThan(0);
  });
});
