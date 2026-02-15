import type { BridgeName, ModelSelector, ToolCommand } from "../types.js";

const AUTO_PRIMARY_BY_COMMAND: Record<ToolCommand, BridgeName> = {
  review: "codex",
  plan: "claude",
  fix: "codex",
  debate: "codex",
  memory: "codex",
  cost: "codex",
};

const AUTO_FALLBACK_BY_COMMAND: Record<ToolCommand, BridgeName[]> = {
  review: ["gemini", "claude"],
  plan: ["codex", "gemini"],
  fix: ["claude", "gemini"],
  debate: ["claude", "gemini"],
  memory: ["gemini", "claude"],
  cost: ["gemini", "claude"],
};

export interface RoutingInput {
  command: ToolCommand;
  selector: ModelSelector;
  fallback?: BridgeName[];
  preferredAutoOrder?: BridgeName[];
}

export function buildAttemptOrder(input: RoutingInput): BridgeName[] {
  if (input.selector === "hybrid") {
    return [];
  }

  if (input.selector === "auto") {
    const autoOrder =
      input.preferredAutoOrder && input.preferredAutoOrder.length > 0
        ? input.preferredAutoOrder
        : [AUTO_PRIMARY_BY_COMMAND[input.command], ...AUTO_FALLBACK_BY_COMMAND[input.command]];
    const fallback = input.fallback ?? [];
    return unique([...autoOrder, ...fallback]);
  }

  const fallback = input.fallback ?? AUTO_FALLBACK_BY_COMMAND[input.command];
  return unique([input.selector, ...fallback]);
}

function unique(values: BridgeName[]): BridgeName[] {
  const seen = new Set<BridgeName>();
  const result: BridgeName[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}
