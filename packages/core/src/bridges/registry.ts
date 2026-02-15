import type { BridgeName } from "../types.js";
import type { BridgeAdapter } from "./adapter.js";

export class BridgeRegistry {
  private readonly adapters: Record<BridgeName, BridgeAdapter>;

  constructor(adapters: Record<BridgeName, BridgeAdapter>) {
    this.adapters = adapters;
  }

  get(name: BridgeName): BridgeAdapter {
    return this.adapters[name];
  }

  list(): BridgeName[] {
    return Object.keys(this.adapters) as BridgeName[];
  }

  async healthSnapshot(): Promise<Record<BridgeName, boolean>> {
    const entries = await Promise.all(
      this.list().map(async (bridge) => {
        const healthy = await this.adapters[bridge].healthCheck();
        return [bridge, healthy] as const;
      }),
    );

    return Object.fromEntries(entries) as Record<BridgeName, boolean>;
  }
}
