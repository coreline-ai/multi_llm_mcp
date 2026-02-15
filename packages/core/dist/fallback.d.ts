import type { BridgeName, ErrorCode } from "./types.js";
export interface AttemptError {
    bridge: BridgeName;
    code: ErrorCode;
    message: string;
}
export declare class FallbackExecutor {
    private readonly maxRetriesPerBridge;
    private readonly backoffMs;
    constructor(maxRetriesPerBridge?: number, backoffMs?: number);
    run<T>(order: BridgeName[], runner: (bridge: BridgeName, attemptNo: number, fallbackFrom?: BridgeName) => Promise<T>): Promise<{
        result: T;
        selected: BridgeName;
        errors: AttemptError[];
        fallbackTried: BridgeName[];
    }>;
}
//# sourceMappingURL=fallback.d.ts.map