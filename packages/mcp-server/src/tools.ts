import type { ToolCommand } from "@multimcp/core";

export const MCP_TOOLS = [
  "multimcp_review",
  "multimcp_plan",
  "multimcp_fix",
  "multimcp_debate",
  "multimcp_memory",
  "multimcp_cost",
] as const;

export type McpToolName = (typeof MCP_TOOLS)[number];

const TOOL_COMMAND_MAP: Record<McpToolName, ToolCommand> = {
  multimcp_review: "review",
  multimcp_plan: "plan",
  multimcp_fix: "fix",
  multimcp_debate: "debate",
  multimcp_memory: "memory",
  multimcp_cost: "cost",
};

export function toToolCommand(name: McpToolName): ToolCommand {
  return TOOL_COMMAND_MAP[name];
}

export function isMcpToolName(value: string): value is McpToolName {
  return MCP_TOOLS.includes(value as McpToolName);
}
