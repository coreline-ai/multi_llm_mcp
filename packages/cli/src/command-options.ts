import type { BridgeName, ToolCommand, ToolInput } from "@multimcp/core";

export function parseOptions(rawArgs: string[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (let i = 0; i < rawArgs.length; i += 1) {
    const key = rawArgs[i];
    if (!key || !key.startsWith("--")) {
      continue;
    }

    const normalizedKey = key.replace(/^--/, "");
    const value = rawArgs[i + 1];
    if (!value || value.startsWith("--")) {
      options[normalizedKey] = "true";
      continue;
    }

    options[normalizedKey] = value;
    i += 1;
  }
  return options;
}

export function toToolInput(command: ToolCommand, options: Record<string, string>): ToolInput {
  const input: ToolInput = {
    session_id: options["session-id"],
    model_selector: toModelSelector(options["model-selector"]),
    routing_policy: toRoutingPolicy(options["routing-policy"]),
    fallback: parseBridgeList(options.fallback),
    constraints: {
      max_latency_ms: toOptionalNumber(options["max-latency-ms"]),
      max_retries_per_bridge: toOptionalNumber(options["max-retries-per-bridge"]),
      max_prompt_chars: toOptionalNumber(options["max-prompt-chars"]),
    },
  };

  if (command === "debate") {
    input.question = options.question ?? options.prompt;
    input.participants = parseBridgeList(options.participants);
    input.maxRounds = toOptionalNumber(options["max-rounds"]);
  } else {
    input.prompt = options.prompt;
  }

  return input;
}

function toModelSelector(value?: string): ToolInput["model_selector"] {
  if (!value) {
    return "auto";
  }
  if (
    value === "auto" ||
    value === "hybrid" ||
    value === "codex" ||
    value === "claude" ||
    value === "gemini"
  ) {
    return value;
  }
  return "auto";
}

function toRoutingPolicy(value?: string): ToolInput["routing_policy"] {
  if (!value) {
    return undefined;
  }
  if (
    value === "default" ||
    value === "quality_first" ||
    value === "speed_first" ||
    value === "cost_first"
  ) {
    return value;
  }
  return undefined;
}

function toOptionalNumber(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
}

function parseBridgeList(value?: string): BridgeName[] | undefined {
  if (!value) {
    return undefined;
  }

  const list = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(
      (entry): entry is BridgeName => entry === "codex" || entry === "claude" || entry === "gemini",
    );

  return list.length > 0 ? list : undefined;
}
