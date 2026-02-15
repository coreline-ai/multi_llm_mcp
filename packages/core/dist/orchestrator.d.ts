import type { BridgeAdapter } from "./bridges/adapter.js";
import { InMemoryDebateStore } from "./debate/debate-store.js";
import { InMemoryEventStore } from "./events/event-store.js";
import { InMemorySessionStore } from "./session/session-store.js";
import type { BridgeName, ToolCommand, ToolInput, ToolResult } from "./types.js";
export interface OrchestratorOptions {
    adapters?: Partial<Record<BridgeName, BridgeAdapter>>;
    sessionStore?: InMemorySessionStore;
    eventStore?: InMemoryEventStore;
    debateStore?: InMemoryDebateStore;
}
export declare class Orchestrator {
    private readonly registry;
    private readonly sessionStore;
    private readonly eventStore;
    private readonly debateStore;
    private readonly debateCache;
    constructor(options?: OrchestratorOptions);
    execute(command: ToolCommand, input: ToolInput): Promise<ToolResult>;
    private executeHybridDebate;
    getSessionStore(): InMemorySessionStore;
    getEventStore(): InMemoryEventStore;
}
//# sourceMappingURL=orchestrator.d.ts.map