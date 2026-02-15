export class InMemoryEventStore {
    events = [];
    append(event) {
        this.events.push(event);
    }
    listByRequest(requestId) {
        return this.events.filter((event) => event.request_id === requestId);
    }
    listAll() {
        return [...this.events];
    }
}
//# sourceMappingURL=event-store.js.map