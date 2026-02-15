import { CoreError, Orchestrator, type ToolInput, type ToolResult } from "@multimcp/core";

import { MCP_TOOLS, type McpToolName, isMcpToolName, toToolCommand } from "./tools.js";

export interface ToolCallRequest {
  tool: string;
  input: ToolInput;
}

export class MultiMcpServer {
  private readonly orchestrator: Orchestrator;

  constructor(orchestrator = new Orchestrator()) {
    this.orchestrator = orchestrator;
  }

  listTools(): readonly McpToolName[] {
    return MCP_TOOLS;
  }

  async callTool(request: ToolCallRequest): Promise<ToolResult> {
    if (!isMcpToolName(request.tool)) {
      throw new CoreError("VALIDATION_ERROR", `unknown tool: ${request.tool}`);
    }

    const command = toToolCommand(request.tool);
    return this.orchestrator.execute(command, request.input);
  }
}
