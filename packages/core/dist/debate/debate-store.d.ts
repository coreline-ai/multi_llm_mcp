import type { BridgeName } from "../types.js";
export interface DebateMessage {
    role: BridgeName;
    text: string;
    round: number;
    status: "queued" | "running" | "completed";
}
export interface DebateRecord {
    debateId: string;
    sessionId: string;
    participants: BridgeName[];
    maxRounds: number;
    messages: DebateMessage[];
    status: "active" | "completed";
}
export declare class InMemoryDebateStore {
    private readonly debates;
    start(debateId: string, sessionId: string, participants: BridgeName[], maxRounds: number): DebateRecord;
    appendMessage(debateId: string, message: DebateMessage): void;
    complete(debateId: string): void;
    get(debateId: string): DebateRecord | undefined;
}
//# sourceMappingURL=debate-store.d.ts.map