import { spawnSync } from "node:child_process";
export function checkCommandExists(command) {
    const result = spawnSync("sh", ["-lc", `command -v ${command}`], {
        stdio: "ignore",
    });
    return result.status === 0;
}
export function runDoctor() {
    const bridges = [
        { bridge: "codex", installed: checkCommandExists("codex") },
        { bridge: "claude", installed: checkCommandExists("claude") },
        { bridge: "gemini", installed: checkCommandExists("gemini") },
    ];
    return {
        status: bridges.every((entry) => entry.installed) ? "ok" : "degraded",
        bridges,
    };
}
//# sourceMappingURL=index.js.map