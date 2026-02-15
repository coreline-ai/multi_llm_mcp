export class FallbackExecutor {
    maxRetriesPerBridge;
    backoffMs;
    constructor(maxRetriesPerBridge = 1, backoffMs = 10) {
        this.maxRetriesPerBridge = Math.max(1, maxRetriesPerBridge);
        this.backoffMs = Math.max(0, backoffMs);
    }
    async run(order, runner) {
        const errors = [];
        const retryCounter = new Map();
        const fallbackTried = [];
        for (let index = 0; index < order.length; index++) {
            const bridge = order[index];
            const used = retryCounter.get(bridge) ?? 0;
            if (used >= this.maxRetriesPerBridge) {
                continue;
            }
            retryCounter.set(bridge, used + 1);
            try {
                const value = await runner(bridge, index + 1, index > 0 ? order[index - 1] : undefined);
                return {
                    result: value,
                    selected: bridge,
                    errors,
                    fallbackTried,
                };
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "unknown error";
                const code = extractErrorCode(error);
                errors.push({ bridge, code, message });
                if (index > 0) {
                    fallbackTried.push(bridge);
                }
                if (index < order.length - 1 && this.backoffMs > 0) {
                    await sleep(this.backoffMs * (index + 1));
                }
            }
        }
        const final = errors.at(-1);
        const message = final?.message ?? "all bridges failed";
        throw new Error(message);
    }
}
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function extractErrorCode(error) {
    if (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string") {
        return error.code;
    }
    return "TOOL_ERROR";
}
//# sourceMappingURL=fallback.js.map