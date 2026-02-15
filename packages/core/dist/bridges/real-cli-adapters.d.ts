import type { BridgeName } from "../types.js";
import type { BridgeAdapter } from "./adapter.js";
export interface ParsedBridgeOutput {
    text: string;
    inputTokens?: number;
    outputTokens?: number;
}
export declare function createRealCliAdapters(): Record<BridgeName, BridgeAdapter>;
export declare function shouldUseRealCliAdapters(): boolean;
export declare function parseCodexJsonLines(stdout: string): ParsedBridgeOutput;
export declare function parseClaudeJson(stdout: string): ParsedBridgeOutput;
export declare function parseGeminiJson(stdout: string): ParsedBridgeOutput;
//# sourceMappingURL=real-cli-adapters.d.ts.map