import type { BridgeName } from "../types.js";
import type { BridgeAdapter } from "./adapter.js";
export declare class BridgeRegistry {
    private readonly adapters;
    constructor(adapters: Record<BridgeName, BridgeAdapter>);
    get(name: BridgeName): BridgeAdapter;
    list(): BridgeName[];
    healthSnapshot(): Promise<Record<BridgeName, boolean>>;
}
//# sourceMappingURL=registry.d.ts.map