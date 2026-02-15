import type { BridgeName } from "../types.js";
import type { BridgeAdapter } from "./adapter.js";
import { defaultAdapters as mockAdapters } from "./mock-adapters.js";
import { createRealCliAdapters, shouldUseRealCliAdapters } from "./real-cli-adapters.js";

export function createDefaultAdapters(): Record<BridgeName, BridgeAdapter> {
  if (shouldUseRealCliAdapters()) {
    return createRealCliAdapters();
  }
  return mockAdapters;
}
