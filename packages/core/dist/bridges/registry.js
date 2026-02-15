export class BridgeRegistry {
    adapters;
    constructor(adapters) {
        this.adapters = adapters;
    }
    get(name) {
        return this.adapters[name];
    }
    list() {
        return Object.keys(this.adapters);
    }
    async healthSnapshot() {
        const entries = await Promise.all(this.list().map(async (bridge) => {
            const healthy = await this.adapters[bridge].healthCheck();
            return [bridge, healthy];
        }));
        return Object.fromEntries(entries);
    }
}
//# sourceMappingURL=registry.js.map