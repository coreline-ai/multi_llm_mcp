import type { BridgeName } from "../types.js";

export interface SessionRecord {
  session_id: string;
  thread_claude?: string;
  thread_codex?: string;
  thread_gemini?: string;
  active_bridge?: BridgeName;
}

export class InMemorySessionStore {
  private readonly store = new Map<string, SessionRecord>();

  get(sessionId: string): SessionRecord | undefined {
    return this.store.get(sessionId);
  }

  getThread(sessionId: string, bridge: BridgeName): string | undefined {
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

  setThread(sessionId: string, bridge: BridgeName, threadId: string): SessionRecord {
    const current = this.store.get(sessionId) ?? { session_id: sessionId };
    if (bridge === "claude") {
      current.thread_claude = threadId;
    } else if (bridge === "codex") {
      current.thread_codex = threadId;
    } else {
      current.thread_gemini = threadId;
    }
    current.active_bridge = bridge;
    this.store.set(sessionId, current);
    return current;
  }

  // Compat accessor for legacy codex-only key naming.
  getLegacyCodexThreadId(sessionId: string): string | undefined {
    return this.getThread(sessionId, "codex");
  }
}
