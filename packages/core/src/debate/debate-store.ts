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

export class InMemoryDebateStore {
  private readonly debates = new Map<string, DebateRecord>();

  start(
    debateId: string,
    sessionId: string,
    participants: BridgeName[],
    maxRounds: number,
  ): DebateRecord {
    const current = this.debates.get(debateId);
    if (current) {
      return current;
    }

    const record: DebateRecord = {
      debateId,
      sessionId,
      participants,
      maxRounds,
      messages: [],
      status: "active",
    };
    this.debates.set(debateId, record);
    return record;
  }

  appendMessage(debateId: string, message: DebateMessage): void {
    const record = this.debates.get(debateId);
    if (!record) {
      return;
    }
    record.messages.push(message);
  }

  complete(debateId: string): void {
    const record = this.debates.get(debateId);
    if (record) {
      record.status = "completed";
    }
  }

  get(debateId: string): DebateRecord | undefined {
    return this.debates.get(debateId);
  }
}
