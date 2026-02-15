import type { BridgeName } from "../types.js";
export interface SessionRecord {
    session_id: string;
    thread_claude?: string;
    thread_codex?: string;
    thread_gemini?: string;
    active_bridge?: BridgeName;
}
export declare class InMemorySessionStore {
    private readonly store;
    get(sessionId: string): SessionRecord | undefined;
    getThread(sessionId: string, bridge: BridgeName): string | undefined;
    setThread(sessionId: string, bridge: BridgeName, threadId: string): SessionRecord;
    getLegacyCodexThreadId(sessionId: string): string | undefined;
}
//# sourceMappingURL=session-store.d.ts.map