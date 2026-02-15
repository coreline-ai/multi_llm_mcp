import { Orchestrator, type ToolInput, type ToolResult } from "@multimcp/core";
import { type McpToolName } from "./tools.js";
export interface ToolCallRequest {
    tool: string;
    input: ToolInput;
}
export declare class MultiMcpServer {
    private readonly orchestrator;
    constructor(orchestrator?: Orchestrator);
    listTools(): readonly McpToolName[];
    callTool(request: ToolCallRequest): Promise<ToolResult>;
}
//# sourceMappingURL=server.d.ts.map