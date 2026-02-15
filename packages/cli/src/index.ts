import { spawnSync } from "node:child_process";

import type { BridgeName } from "@multimcp/core";

export interface BridgeDoctorStatus {
  bridge: BridgeName;
  installed: boolean;
}

export interface DoctorResult {
  status: "ok" | "degraded";
  bridges: BridgeDoctorStatus[];
}

export function checkCommandExists(command: string): boolean {
  const result = spawnSync("sh", ["-lc", `command -v ${command}`], {
    stdio: "ignore",
  });
  return result.status === 0;
}

export function runDoctor(): DoctorResult {
  const bridges: BridgeDoctorStatus[] = [
    { bridge: "codex", installed: checkCommandExists("codex") },
    { bridge: "claude", installed: checkCommandExists("claude") },
    { bridge: "gemini", installed: checkCommandExists("gemini") },
  ];

  return {
    status: bridges.every((entry) => entry.installed) ? "ok" : "degraded",
    bridges,
  };
}
