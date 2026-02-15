import { spawn, spawnSync } from "node:child_process";

import { CoreError } from "../errors.js";
import type { BridgeName } from "../types.js";
import type { BridgeAdapter, BridgeSendInput } from "./adapter.js";
import { resolveCodexModelByProfile } from "./mock-adapters.js";

export interface ParsedBridgeOutput {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

interface CliAdapterConfig {
  name: BridgeName;
  defaultModel: string;
  fallbackModels?: string[];
  command: string;
  buildArgs: (prompt: string, model: string) => string[];
  parse: (stdout: string) => ParsedBridgeOutput;
  healthCheckArgs: string[];
  isModelUnavailableError?: (message: string) => boolean;
}

const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_MAX_OUTPUT_BYTES = 2_000_000;
const COMPAT_CODEX_MODEL = "gpt-5-codex";

class CliBridgeAdapter implements BridgeAdapter {
  readonly name: BridgeName;
  private activeModel: string;
  private readonly modelChain: string[];
  private readonly isModelUnavailableError: (message: string) => boolean;

  constructor(private readonly config: CliAdapterConfig) {
    this.name = config.name;
    this.activeModel = config.defaultModel;
    this.modelChain = uniqueStrings([config.defaultModel, ...(config.fallbackModels ?? [])]);
    this.isModelUnavailableError = config.isModelUnavailableError ?? defaultModelUnavailableMatcher;
  }

  get model(): string {
    return this.activeModel;
  }

  async healthCheck(): Promise<boolean> {
    if (!commandExists(this.config.command)) {
      return false;
    }

    const status = spawnSync(this.config.command, this.config.healthCheckArgs, {
      stdio: "ignore",
    }).status;
    return status === 0;
  }

  async send(input: BridgeSendInput): Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
  }> {
    const prompt = `Return plain text only. Do not use tools.\n${input.prompt}`;
    let lastError: unknown = undefined;

    for (const [index, model] of this.modelChain.entries()) {
      const startedAt = Date.now();
      try {
        const { stdout, stderr } = await runCommand(
          this.config.command,
          this.config.buildArgs(prompt, model),
          DEFAULT_TIMEOUT_MS,
          DEFAULT_MAX_OUTPUT_BYTES,
        );
        const parsed = this.config.parse(stdout);
        const text = parsed.text || stderr.trim() || `[${this.name}] empty response`;

        const inputTokens = parsed.inputTokens ?? estimateTokens(prompt);
        const outputTokens = parsed.outputTokens ?? estimateTokens(text);
        this.activeModel = model;

        return {
          text,
          inputTokens,
          outputTokens,
          latencyMs: Date.now() - startedAt,
        };
      } catch (error) {
        lastError = error;
        const hasNextModel = index < this.modelChain.length - 1;
        const message = error instanceof Error ? error.message : "";
        if (!hasNextModel || !this.isModelUnavailableError(message)) {
          throw error;
        }
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new CoreError("TOOL_ERROR", `${this.name} failed without a recoverable model`);
  }

  async resume(
    threadId: string,
    input: BridgeSendInput,
  ): Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
  }> {
    return this.send({
      ...input,
      prompt: `[resume:${threadId}] ${input.prompt}`,
    });
  }
}

export function createRealCliAdapters(): Record<BridgeName, BridgeAdapter> {
  const codexModel = process.env.MULTIMCP_CODEX_MODEL ?? resolveCodexModelByProfile();
  const claudeModel = process.env.MULTIMCP_CLAUDE_MODEL ?? "claude-sonnet-4";
  const geminiModel = process.env.MULTIMCP_GEMINI_MODEL ?? "gemini-2.5-flash-lite";
  const codexFallbackModels = uniqueStrings([
    ...parseModelList(process.env.MULTIMCP_CODEX_FALLBACK_MODELS),
    ...(codexModel !== COMPAT_CODEX_MODEL ? [COMPAT_CODEX_MODEL] : []),
  ]);
  const claudeFallbackModels = parseModelList(process.env.MULTIMCP_CLAUDE_FALLBACK_MODELS);
  const geminiFallbackModels = parseModelList(process.env.MULTIMCP_GEMINI_FALLBACK_MODELS);

  return {
    codex: new CliBridgeAdapter({
      name: "codex",
      defaultModel: codexModel,
      fallbackModels: codexFallbackModels,
      command: "codex",
      buildArgs: (prompt, model) => [
        "exec",
        "--skip-git-repo-check",
        "--json",
        "-m",
        model,
        prompt,
      ],
      parse: parseCodexJsonLines,
      healthCheckArgs: ["--version"],
      isModelUnavailableError: isLikelyModelUnavailableError,
    }),
    claude: new CliBridgeAdapter({
      name: "claude",
      defaultModel: claudeModel,
      fallbackModels: claudeFallbackModels,
      command: "claude",
      buildArgs: (prompt, model) => [
        "-p",
        "--output-format",
        "json",
        "--no-session-persistence",
        "--model",
        model,
        prompt,
      ],
      parse: parseClaudeJson,
      healthCheckArgs: ["--version"],
      isModelUnavailableError: isLikelyModelUnavailableError,
    }),
    gemini: new CliBridgeAdapter({
      name: "gemini",
      defaultModel: geminiModel,
      fallbackModels: geminiFallbackModels,
      command: "gemini",
      buildArgs: (prompt, model) => ["--output-format", "json", "--model", model, prompt],
      parse: parseGeminiJson,
      healthCheckArgs: ["--version"],
      isModelUnavailableError: isLikelyModelUnavailableError,
    }),
  };
}

export function shouldUseRealCliAdapters(): boolean {
  return process.env.MULTIMCP_USE_REAL_BRIDGES === "1";
}

export function parseCodexJsonLines(stdout: string): ParsedBridgeOutput {
  let messageText = "";
  let inputTokens: number | undefined;
  let outputTokens: number | undefined;

  for (const line of stdout.split("\n").map((entry) => entry.trim())) {
    if (!line) {
      continue;
    }
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      if (
        parsed.type === "item.completed" &&
        typeof parsed.item === "object" &&
        parsed.item &&
        (parsed.item as Record<string, unknown>).type === "agent_message"
      ) {
        const text = (parsed.item as Record<string, unknown>).text;
        if (typeof text === "string") {
          messageText = text.trim();
        }
      }
      if (parsed.type === "turn.completed" && typeof parsed.usage === "object" && parsed.usage) {
        const usage = parsed.usage as Record<string, unknown>;
        if (typeof usage.input_tokens === "number") {
          inputTokens = usage.input_tokens;
        }
        if (typeof usage.output_tokens === "number") {
          outputTokens = usage.output_tokens;
        }
      }
    } catch {
      // Ignore non-JSON lines.
    }
  }

  return {
    text: messageText || stdout.trim(),
    inputTokens,
    outputTokens,
  };
}

export function parseClaudeJson(stdout: string): ParsedBridgeOutput {
  const parsed = parseLastJsonObject(stdout);
  if (!parsed) {
    return { text: stdout.trim() };
  }

  const usage =
    typeof parsed.usage === "object" && parsed.usage
      ? (parsed.usage as Record<string, unknown>)
      : {};

  return {
    text:
      typeof parsed.result === "string"
        ? parsed.result
        : typeof parsed.response === "string"
          ? parsed.response
          : stdout.trim(),
    inputTokens: typeof usage.input_tokens === "number" ? usage.input_tokens : undefined,
    outputTokens: typeof usage.output_tokens === "number" ? usage.output_tokens : undefined,
  };
}

export function parseGeminiJson(stdout: string): ParsedBridgeOutput {
  const parsed = parseLastJsonObject(stdout);
  if (!parsed) {
    return { text: stdout.trim() };
  }

  let inputTokens: number | undefined;
  let outputTokens: number | undefined;

  if (typeof parsed.stats === "object" && parsed.stats) {
    const stats = parsed.stats as Record<string, unknown>;
    const models =
      typeof stats.models === "object" && stats.models
        ? (stats.models as Record<string, unknown>)
        : {};
    let promptTotal = 0;
    let candidateTotal = 0;

    for (const value of Object.values(models)) {
      if (typeof value !== "object" || !value) {
        continue;
      }
      const tokens = (value as Record<string, unknown>).tokens;
      if (typeof tokens !== "object" || !tokens) {
        continue;
      }
      const tokenMap = tokens as Record<string, unknown>;
      if (typeof tokenMap.prompt === "number") {
        promptTotal += tokenMap.prompt;
      }
      if (typeof tokenMap.candidates === "number") {
        candidateTotal += tokenMap.candidates;
      }
    }

    if (promptTotal > 0) {
      inputTokens = promptTotal;
    }
    if (candidateTotal > 0) {
      outputTokens = candidateTotal;
    }
  }

  return {
    text:
      typeof parsed.response === "string"
        ? parsed.response
        : typeof parsed.result === "string"
          ? parsed.result
          : stdout.trim(),
    inputTokens,
    outputTokens,
  };
}

function parseLastJsonObject(stdout: string): Record<string, unknown> | undefined {
  const lines = stdout
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const candidate = lines[index];
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === "object" && parsed) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // ignore
    }
  }

  try {
    const parsed = JSON.parse(stdout);
    if (typeof parsed === "object" && parsed) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore
  }

  return undefined;
}

async function runCommand(
  command: string,
  args: string[],
  timeoutMs: number,
  maxOutputBytes: number,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let didTimeout = false;

    const timeout = setTimeout(() => {
      didTimeout = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdoutBytes += Buffer.byteLength(chunk);
      if (stdoutBytes <= maxOutputBytes) {
        stdout += chunk;
      }
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderrBytes += Buffer.byteLength(chunk);
      if (stderrBytes <= maxOutputBytes) {
        stderr += chunk;
      }
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(new CoreError("UNAVAILABLE", `${command} spawn failed: ${error.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (didTimeout) {
        reject(new CoreError("TIMEOUT", `${command} timed out after ${timeoutMs}ms`));
        return;
      }

      if (code !== 0) {
        const details = stderr.trim() || stdout.trim() || `exit code ${code}`;
        reject(new CoreError("TOOL_ERROR", `${command} failed: ${details}`));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

function commandExists(command: string): boolean {
  return spawnSync("sh", ["-lc", `command -v ${command}`], { stdio: "ignore" }).status === 0;
}

function parseModelList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return uniqueStrings(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
  );
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }

  return result;
}

function defaultModelUnavailableMatcher(message: string): boolean {
  return isLikelyModelUnavailableError(message);
}

function isLikelyModelUnavailableError(message: string): boolean {
  const normalized = message.toLowerCase();
  if (!normalized.includes("model")) {
    return false;
  }

  return (
    normalized.includes("does not exist") ||
    normalized.includes("do not have access") ||
    normalized.includes("not have access") ||
    normalized.includes("not supported") ||
    normalized.includes("not available") ||
    normalized.includes("model not found") ||
    normalized.includes("unknown model")
  );
}

function estimateTokens(text: string): number {
  return Math.max(8, Math.ceil(text.length / 4));
}
