export type BridgeName = "claude" | "codex" | "gemini";
export type ToolCommand = "review" | "plan" | "fix" | "debate" | "memory" | "cost";
export type RoutingPolicy = "default" | "quality_first" | "speed_first" | "cost_first";
export type ModelSelector = "auto" | "hybrid" | BridgeName;
export type ErrorCode = "UNAVAILABLE" | "AUTH" | "TIMEOUT" | "RATE_LIMIT" | "PARSE_ERROR" | "TOOL_ERROR" | "UNKNOWN" | "VALIDATION_ERROR";
export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
}
export interface RoutingConstraints {
    max_latency_ms?: number;
    max_retries_per_bridge?: number;
    max_prompt_chars?: number;
    prefer_cost?: "low" | "balanced" | "quality";
}
export interface ToolInput {
    session_id?: string;
    prompt?: string;
    question?: string;
    model_selector?: ModelSelector;
    fallback?: BridgeName[];
    routing_policy?: RoutingPolicy;
    constraints?: RoutingConstraints;
    participants?: BridgeName[];
    maxRounds?: number;
}
export interface BridgeResponse {
    bridge: BridgeName;
    model: string;
    text: string;
    tokenUsage: TokenUsage;
    latencyMs: number;
    meteringSource: "estimated";
}
export interface RoutingMeta {
    selected: BridgeName[];
    fallbackTried: BridgeName[];
    reasonCodes: string[];
}
export interface ToolResult {
    requestId: string;
    debateId?: string;
    status: "success" | "partial_failure" | "failed";
    responses: BridgeResponse[];
    totalTokenUsage: TokenUsage;
    partialFailure: boolean;
    egressControl: "cli-managed";
    consensus?: "agree" | "mixed" | "conflict";
    stanceSummary?: string;
    routing: RoutingMeta;
    errors?: Array<{
        bridge: BridgeName;
        code: ErrorCode;
        message: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map