export class InMemoryDebateStore {
    debates = new Map();
    start(debateId, sessionId, participants, maxRounds) {
        const current = this.debates.get(debateId);
        if (current) {
            return current;
        }
        const record = {
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
    appendMessage(debateId, message) {
        const record = this.debates.get(debateId);
        if (!record) {
            return;
        }
        record.messages.push(message);
    }
    complete(debateId) {
        const record = this.debates.get(debateId);
        if (record) {
            record.status = "completed";
        }
    }
    get(debateId) {
        return this.debates.get(debateId);
    }
}
//# sourceMappingURL=debate-store.js.map