import type { BridgeName, ErrorCode, ToolCommand } from "../types.js";
export interface ExecutionEvent {
    request_id: string;
    command: ToolCommand;
    bridge: BridgeName;
    attempt_no: number;
    fallback_from?: BridgeName;
    error_code?: ErrorCode;
    routing_reason: string;
    latency_ms?: number;
    token_total?: number;
    status: "attempt" | "success" | "error";
}
export declare class InMemoryEventStore {
    private readonly events;
    append(event: ExecutionEvent): void;
    listByRequest(requestId: string): ExecutionEvent[];
    listAll(): ExecutionEvent[];
}
//# sourceMappingURL=event-store.d.ts.map