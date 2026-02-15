import type { RoutingPolicy } from "../types.js";

export function normalizeRoutingPolicy(policy?: RoutingPolicy): RoutingPolicy {
  return policy ?? "default";
}
