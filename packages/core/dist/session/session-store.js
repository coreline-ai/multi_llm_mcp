export class InMemorySessionStore {
    store = new Map();
    get(sessionId) {
        return this.store.get(sessionId);
    }
    getThread(sessionId, bridge) {
        const record = this.store.get(sessionId);
        if (!record) {
            return undefined;
        }
        if (bridge === "claude") {
            return record.thread_claude;
        }
        if (bridge === "codex") {
            return record.thread_codex;
        }
        return record.thread_gemini;
    }
    setThread(sessionId, bridge, threadId) {
        const current = this.store.get(sessionId) ?? { session_id: sessionId };
        if (bridge === "claude") {
            current.thread_claude = threadId;
        }
        else if (bridge === "codex") {
            current.thread_codex = threadId;
        }
        else {
            current.thread_gemini = threadId;
        }
        current.active_bridge = bridge;
        this.store.set(sessionId, current);
        return current;
    }
    // Compat accessor for legacy codex-only key naming.
    getLegacyCodexThreadId(sessionId) {
        return this.getThread(sessionId, "codex");
    }
}
//# sourceMappingURL=session-store.js.map