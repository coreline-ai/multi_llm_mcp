import { CoreError } from "../errors.js";
class MockBridgeAdapter {
    name;
    model;
    constructor(name, model) {
        this.name = name;
        this.model = model;
    }
    async healthCheck() {
        return true;
    }
    async send(input) {
        const failToken = `fail:${this.name}`;
        if (input.prompt.includes(failToken)) {
            throw new CoreError("TOOL_ERROR", `Bridge ${this.name} forced failure`);
        }
        const inputTokens = Math.max(8, Math.ceil(input.prompt.length / 4));
        const outputTokens = Math.max(12, Math.ceil(input.prompt.length / 6));
        return {
            text: `[${this.name}] ${input.command} response for: ${input.prompt}`,
            inputTokens,
            outputTokens,
            latencyMs: 250 + this.name.length * 20,
        };
    }
    async resume(threadId, input) {
        const resumed = await this.send(input);
        return {
            ...resumed,
            text: `[resume:${threadId}] ${resumed.text}`,
        };
    }
}
export const defaultAdapters = {
    codex: new MockBridgeAdapter("codex", resolveCodexModelByProfile()),
    claude: new MockBridgeAdapter("claude", "claude-sonnet-4"),
    gemini: new MockBridgeAdapter("gemini", "gemini-2.5-pro"),
};
export function resolveCodexModelByProfile() {
    const profile = (process.env.MULTIMCP_MODEL_PROFILE ?? "default").trim().toLowerCase();
    if (profile === "compat") {
        return "gpt-5-codex";
    }
    return "gpt-5.3-codex";
}
//# sourceMappingURL=mock-adapters.js.map