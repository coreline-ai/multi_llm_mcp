export const MCP_TOOLS = [
    "multimcp_review",
    "multimcp_plan",
    "multimcp_fix",
    "multimcp_debate",
    "multimcp_memory",
    "multimcp_cost",
];
const TOOL_COMMAND_MAP = {
    multimcp_review: "review",
    multimcp_plan: "plan",
    multimcp_fix: "fix",
    multimcp_debate: "debate",
    multimcp_memory: "memory",
    multimcp_cost: "cost",
};
export function toToolCommand(name) {
    return TOOL_COMMAND_MAP[name];
}
export function isMcpToolName(value) {
    return MCP_TOOLS.includes(value);
}
//# sourceMappingURL=tools.js.map