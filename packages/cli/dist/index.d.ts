import type { BridgeName } from "@multimcp/core";
export interface BridgeDoctorStatus {
    bridge: BridgeName;
    installed: boolean;
}
export interface DoctorResult {
    status: "ok" | "degraded";
    bridges: BridgeDoctorStatus[];
}
export declare function checkCommandExists(command: string): boolean;
export declare function runDoctor(): DoctorResult;
//# sourceMappingURL=index.d.ts.map