import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const runRealBridgeE2E = process.env.MULTIMCP_REAL_BRIDGE_E2E === "1";
const describeReal = runRealBridgeE2E ? describe : describe.skip;
const TEST_TIMEOUT_MS = Number(process.env.MULTIMCP_REAL_BRIDGE_TEST_TIMEOUT_MS ?? 240_000);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN_PATH = path.resolve(__dirname, "../dist/bin.js");

function onceLine(command: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
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

describeReal("mcp-server real bridge e2e", () => {
  it(
    "routes multimcp_review to explicit bridges",
    async () => {
      const bridgeCases = ["codex", "claude", "gemini"] as const;

      for (const bridge of bridgeCases) {
        const line = await onceLine({
          action: "call_tool",
          tool: "multimcp_review",
          input: {
            model_selector: bridge,
            prompt: `mcp real integration smoke: ${bridge}`,
          },
        });

        const parsed = JSON.parse(line) as {
          status: string;
          responses: Array<{ bridge: string; text: string }>;
          totalTokenUsage: { totalTokens: number };
        };

        expect(parsed.status).toBe("success");
        expect(parsed.responses[0]?.bridge).toBe(bridge);
        expect(parsed.responses[0]?.text.length ?? 0).toBeGreaterThan(0);
        expect(parsed.totalTokenUsage.totalTokens).toBeGreaterThan(0);
      }
    },
    TEST_TIMEOUT_MS,
  );

  it(
    "executes multimcp_debate in hybrid mode across three bridges",
    async () => {
      const line = await onceLine({
        action: "call_tool",
        tool: "multimcp_debate",
        input: {
          model_selector: "hybrid",
          participants: ["claude", "codex", "gemini"],
          question: "mcp real hybrid smoke test",
          maxRounds: 1,
        },
      });

      const parsed = JSON.parse(line) as {
        status: string;
        routing: { selected: string[] };
        responses: Array<{ bridge: string }>;
      };

      expect(parsed.status).toBe("success");
      expect(parsed.responses).toHaveLength(3);
      expect(parsed.routing.selected).toEqual(["claude", "codex", "gemini"]);
    },
    TEST_TIMEOUT_MS,
  );
});
