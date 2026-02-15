import type { BridgeName, ModelSelector, ToolCommand } from "../types.js";
export interface RoutingInput {
    command: ToolCommand;
    selector: ModelSelector;
    fallback?: BridgeName[];
    preferredAutoOrder?: BridgeName[];
}
export declare function buildAttemptOrder(input: RoutingInput): BridgeName[];
//# sourceMappingURL=selector.d.ts.map