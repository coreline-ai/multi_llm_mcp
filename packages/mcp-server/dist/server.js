import { CoreError, Orchestrator } from "@multimcp/core";
import { MCP_TOOLS, isMcpToolName, toToolCommand } from "./tools.js";
export class MultiMcpServer {
    orchestrator;
    constructor(orchestrator = new Orchestrator()) {
        this.orchestrator = orchestrator;
    }
    listTools() {
        return MCP_TOOLS;
    }
    async callTool(request) {
        if (!isMcpToolName(request.tool)) {
            throw new CoreError("VALIDATION_ERROR", `unknown tool: ${request.tool}`);
        }
        const command = toToolCommand(request.tool);
        return this.orchestrator.execute(command, request.input);
    }
}
//# sourceMappingURL=server.js.map