#!/usr/bin/env node
import readline from "node:readline";
import { CoreError } from "@multimcp/core";
import { ensureBootstrapDb } from "./bootstrap.js";
import { MultiMcpServer } from "./server.js";
try {
    ensureBootstrapDb();
}
catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    const code = error instanceof CoreError ? error.code : "UNKNOWN";
    process.stdout.write(`${JSON.stringify({ status: "error", code, message })}\n`);
    process.exit(1);
}
const server = new MultiMcpServer();
if (process.argv.includes("--list-tools")) {
    process.stdout.write(`${JSON.stringify({ tools: server.listTools() })}\n`);
    process.exit(0);
}
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});
rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
        return;
    }
    try {
        const parsed = JSON.parse(trimmed);
        if (parsed.action === "list_tools") {
            process.stdout.write(`${JSON.stringify({ tools: server.listTools() })}\n`);
            return;
        }
        if (parsed.action === "call_tool" && parsed.tool && parsed.input) {
            const result = await server.callTool({
                tool: parsed.tool,
                input: parsed.input,
            });
            process.stdout.write(`${JSON.stringify(result)}\n`);
            return;
        }
        throw new CoreError("VALIDATION_ERROR", "invalid command shape");
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        const code = error instanceof CoreError ? error.code : "UNKNOWN";
        process.stdout.write(`${JSON.stringify({ status: "error", code, message })}\n`);
    }
});
//# sourceMappingURL=bin.js.map