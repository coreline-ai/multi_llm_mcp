#!/usr/bin/env node
import { CoreError, Orchestrator } from "@multimcp/core";
import { parseOptions, toToolInput } from "./command-options.js";
import { runDoctor } from "./index.js";
const args = process.argv.slice(2);
const command = args[0];
if (command === "doctor") {
    process.stdout.write(`${JSON.stringify(runDoctor(), null, 2)}\n`);
    process.exit(0);
}
const supportedCommands = ["review", "plan", "fix", "debate", "memory", "cost"];
if (command && supportedCommands.includes(command)) {
    const orchestrator = new Orchestrator();
    const options = parseOptions(args.slice(1));
    const input = toToolInput(command, options);
    orchestrator
        .execute(command, input)
        .then((result) => {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exit(0);
    })
        .catch((error) => {
        const code = error instanceof CoreError ? error.code : "UNKNOWN";
        const message = error instanceof Error ? error.message : "unknown error";
        process.stdout.write(`${JSON.stringify({ status: "error", code, message })}\n`);
        process.exit(1);
    });
}
else {
    process.stdout.write(`${JSON.stringify({
        status: "error",
        message: "unknown command",
        available: ["doctor", ...supportedCommands],
    })}\n`);
    process.exit(1);
}
//# sourceMappingURL=bin.js.map