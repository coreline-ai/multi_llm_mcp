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

export class InMemoryEventStore {
  private readonly events: ExecutionEvent[] = [];

  append(event: ExecutionEvent): void {
    this.events.push(event);
  }

  listByRequest(requestId: string): ExecutionEvent[] {
    return this.events.filter((event) => event.request_id === requestId);
  }

  listAll(): ExecutionEvent[] {
    return [...this.events];
  }
}
