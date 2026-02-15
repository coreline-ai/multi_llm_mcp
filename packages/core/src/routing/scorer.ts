import type { BridgeName, RoutingPolicy, ToolCommand } from "../types.js";

interface BridgeProfile {
  quality: number;
  speed: number;
  cost: number;
}

const BRIDGE_PROFILES: Record<BridgeName, BridgeProfile> = {
  codex: { quality: 0.94, speed: 0.9, cost: 0.7 },
  claude: { quality: 0.9, speed: 0.75, cost: 0.55 },
  gemini: { quality: 0.85, speed: 0.88, cost: 0.8 },
};

interface WeightSet {
  quality: number;
  speed: number;
  cost: number;
  health: number;
}

function weightsByPolicy(policy: RoutingPolicy): WeightSet {
  if (policy === "quality_first") {
    return { quality: 0.5, speed: 0.15, cost: 0.05, health: 0.3 };
  }
  if (policy === "speed_first") {
    return { quality: 0.25, speed: 0.4, cost: 0.05, health: 0.3 };
  }
  if (policy === "cost_first") {
    return { quality: 0.2, speed: 0.1, cost: 0.4, health: 0.3 };
  }
  return { quality: 0.35, speed: 0.2, cost: 0.15, health: 0.3 };
}

function commandBias(command: ToolCommand, bridge: BridgeName): number {
  if ((command === "review" || command === "fix") && bridge === "codex") {
    return 0.08;
  }
  if (command === "plan" && bridge === "claude") {
    return 0.04;
  }
  if (command === "cost" && bridge === "gemini") {
    return 0.04;
  }
  return 0;
}

export interface BridgeScore {
  bridge: BridgeName;
  score: number;
}

export function scoreBridges(input: {
  command: ToolCommand;
  policy: RoutingPolicy;
  health: Record<BridgeName, boolean>;
  candidates: BridgeName[];
}): BridgeScore[] {
  const weights = weightsByPolicy(input.policy);
  const scored = input.candidates.map((bridge) => {
    const profile = BRIDGE_PROFILES[bridge];
    const base =
      profile.quality * weights.quality +
      profile.speed * weights.speed +
      profile.cost * weights.cost +
      (input.health[bridge] ? 1 : 0) * weights.health;

    return {
      bridge,
      score: base + commandBias(input.command, bridge),
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}
