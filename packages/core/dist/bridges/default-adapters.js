import { defaultAdapters as mockAdapters } from "./mock-adapters.js";
import { createRealCliAdapters, shouldUseRealCliAdapters } from "./real-cli-adapters.js";
export function createDefaultAdapters() {
    if (shouldUseRealCliAdapters()) {
        return createRealCliAdapters();
    }
    return mockAdapters;
}
//# sourceMappingURL=default-adapters.js.map