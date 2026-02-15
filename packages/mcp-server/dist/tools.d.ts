import type { ToolCommand } from "@multimcp/core";
export declare const MCP_TOOLS: readonly ["multimcp_review", "multimcp_plan", "multimcp_fix", "multimcp_debate", "multimcp_memory", "multimcp_cost"];
export type McpToolName = (typeof MCP_TOOLS)[number];
export declare function toToolCommand(name: McpToolName): ToolCommand;
export declare function isMcpToolName(value: string): value is McpToolName;
//# sourceMappingURL=tools.d.ts.map