const AUTO_PRIMARY_BY_COMMAND = {
    review: "codex",
    plan: "claude",
    fix: "codex",
    debate: "codex",
    memory: "codex",
    cost: "codex",
};
const AUTO_FALLBACK_BY_COMMAND = {
    review: ["gemini", "claude"],
    plan: ["codex", "gemini"],
    fix: ["claude", "gemini"],
    debate: ["claude", "gemini"],
    memory: ["gemini", "claude"],
    cost: ["gemini", "claude"],
};
export function buildAttemptOrder(input) {
    if (input.selector === "hybrid") {
        return [];
    }
    if (input.selector === "auto") {
        const autoOrder = input.preferredAutoOrder && input.preferredAutoOrder.length > 0
            ? input.preferredAutoOrder
            : [AUTO_PRIMARY_BY_COMMAND[input.command], ...AUTO_FALLBACK_BY_COMMAND[input.command]];
        const fallback = input.fallback ?? [];
        return unique([...autoOrder, ...fallback]);
    }
    const fallback = input.fallback ?? AUTO_FALLBACK_BY_COMMAND[input.command];
    return unique([input.selector, ...fallback]);
}
function unique(values) {
    const seen = new Set();
    const result = [];
    for (const value of values) {
        if (!seen.has(value)) {
            seen.add(value);
            result.push(value);
        }
    }
    return result;
}
//# sourceMappingURL=selector.js.map