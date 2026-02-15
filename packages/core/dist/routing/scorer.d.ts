import type { BridgeName, RoutingPolicy, ToolCommand } from "../types.js";
export interface BridgeScore {
    bridge: BridgeName;
    score: number;
}
export declare function scoreBridges(input: {
    command: ToolCommand;
    policy: RoutingPolicy;
    health: Record<BridgeName, boolean>;
    candidates: BridgeName[];
}): BridgeScore[];
//# sourceMappingURL=scorer.d.ts.map