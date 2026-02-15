import { randomUUID } from "node:crypto";
import { createDefaultAdapters } from "./bridges/default-adapters.js";
import { BridgeRegistry } from "./bridges/registry.js";
import { InMemoryDebateStore } from "./debate/debate-store.js";
import { CoreError } from "./errors.js";
import { InMemoryEventStore } from "./events/event-store.js";
import { FallbackExecutor } from "./fallback.js";
import { normalizeRoutingPolicy } from "./routing/policy.js";
import { scoreBridges } from "./routing/scorer.js";
import { buildAttemptOrder } from "./routing/selector.js";
import { sanitizePrompt } from "./security/dlp.js";
import { InMemorySessionStore } from "./session/session-store.js";
export class Orchestrator {
    registry;
    sessionStore;
    eventStore;
    debateStore;
    debateCache = new Map();
    constructor(options = {}) {
        const adapters = {
            ...createDefaultAdapters(),
            ...options.adapters,
        };
        this.registry = new BridgeRegistry(adapters);
        this.sessionStore = options.sessionStore ?? new InMemorySessionStore();
        this.eventStore = options.eventStore ?? new InMemoryEventStore();
        this.debateStore = options.debateStore ?? new InMemoryDebateStore();
    }
    async execute(command, input) {
        const selector = input.model_selector ?? "auto";
        const requestId = randomUUID();
        const sessionId = input.session_id ?? `s_${requestId.slice(0, 8)}`;
        if (selector === "hybrid") {
            if (command !== "debate") {
                throw new CoreError("VALIDATION_ERROR", "hybrid selector is only valid for debate");
            }
            return this.executeHybridDebate(input, requestId, sessionId);
        }
        const promptResult = sanitizePrompt(normalizePrompt(command, input), input.constraints?.max_prompt_chars ?? 12000);
        const prompt = promptResult.prompt;
        const health = await this.registry.healthSnapshot();
        const policy = normalizeRoutingPolicy(input.routing_policy);
        const scoredOrder = scoreBridges({
            command,
            policy,
            health,
            candidates: this.registry.list(),
        }).map((entry) => entry.bridge);
        const attempts = buildAttemptOrder({
            command,
            selector,
            fallback: input.fallback,
            preferredAutoOrder: scoredOrder,
        });
        const maxRetries = input.constraints?.max_retries_per_bridge ?? 1;
        const fallbackExecutor = new FallbackExecutor(maxRetries);
        const { result, selected, errors, fallbackTried } = await fallbackExecutor.run(attempts, async (bridge, attemptNo, fallbackFrom) => {
            const adapter = this.registry.get(bridge);
            const existingThread = this.sessionStore.getThread(sessionId, bridge);
            this.eventStore.append({
                request_id: requestId,
                command,
                bridge,
                attempt_no: attemptNo,
                fallback_from: fallbackFrom,
                routing_reason: existingThread
                    ? "RESUME_ATTEMPT"
                    : attemptNo === 1
                        ? "PRIMARY_ATTEMPT"
                        : "FALLBACK_ATTEMPT",
                status: "attempt",
            });
            if (!health[bridge]) {
                this.eventStore.append({
                    request_id: requestId,
                    command,
                    bridge,
                    attempt_no: attemptNo,
                    fallback_from: fallbackFrom,
                    routing_reason: "HEALTH_UNAVAILABLE",
                    error_code: "UNAVAILABLE",
                    status: "error",
                });
                throw new CoreError("UNAVAILABLE", `${bridge} is unavailable`);
            }
            try {
                const bridgeInput = {
                    command,
                    prompt,
                    maxRounds: input.maxRounds ?? 3,
                };
                const response = existingThread
                    ? await adapter.resume(existingThread, bridgeInput)
                    : await adapter.send(bridgeInput);
                if (typeof input.constraints?.max_latency_ms === "number" &&
                    response.latencyMs > input.constraints.max_latency_ms) {
                    this.eventStore.append({
                        request_id: requestId,
                        command,
                        bridge,
                        attempt_no: attemptNo,
                        fallback_from: fallbackFrom,
                        routing_reason: "LATENCY_EXCEEDED",
                        error_code: "TIMEOUT",
                        status: "error",
                    });
                    throw new CoreError("TIMEOUT", `${bridge} latency exceeded constraint`);
                }
                const threadId = `${bridge}_${requestId}_${attemptNo}`;
                this.sessionStore.setThread(sessionId, bridge, threadId);
                this.eventStore.append({
                    request_id: requestId,
                    command,
                    bridge,
                    attempt_no: attemptNo,
                    fallback_from: fallbackFrom,
                    routing_reason: existingThread
                        ? "RESUME_SUCCESS"
                        : attemptNo === 1
                            ? "PRIMARY_SUCCESS"
                            : "FALLBACK_SUCCESS",
                    latency_ms: response.latencyMs,
                    token_total: response.inputTokens + response.outputTokens,
                    status: "success",
                });
                return {
                    bridge,
                    model: adapter.model,
                    text: response.text,
                    tokenUsage: toTokenUsage(response.inputTokens, response.outputTokens),
                    latencyMs: response.latencyMs,
                    meteringSource: "estimated",
                };
            }
            catch (error) {
                if (error instanceof CoreError) {
                    throw error;
                }
                const message = error instanceof Error ? error.message : "unknown error";
                this.eventStore.append({
                    request_id: requestId,
                    command,
                    bridge,
                    attempt_no: attemptNo,
                    fallback_from: fallbackFrom,
                    routing_reason: "EXECUTION_FAILED",
                    error_code: "TOOL_ERROR",
                    status: "error",
                });
                throw new CoreError("TOOL_ERROR", message);
            }
        });
        const responses = [result];
        return {
            requestId,
            status: errors.length > 0 ? "partial_failure" : "success",
            responses,
            totalTokenUsage: sumTokenUsage(responses),
            partialFailure: errors.length > 0,
            egressControl: "cli-managed",
            routing: {
                selected: [selected],
                fallbackTried,
                reasonCodes: [
                    ...(errors.length > 0 ? ["FALLBACK_SUCCESS"] : ["PRIMARY_SUCCESS"]),
                    ...(promptResult.redacted ? ["DLP_REDACTED"] : []),
                    ...(promptResult.truncated ? ["PROMPT_TRUNCATED"] : []),
                ],
            },
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    async executeHybridDebate(input, requestId, sessionId) {
        const participants = input.participants ?? ["claude", "codex"];
        if (participants.length < 2) {
            throw new CoreError("VALIDATION_ERROR", "hybrid debate needs at least two participants");
        }
        const uniqueParticipants = new Set(participants);
        if (uniqueParticipants.size !== participants.length) {
            throw new CoreError("VALIDATION_ERROR", "participants must be unique");
        }
        const promptResult = sanitizePrompt(normalizePrompt("debate", input), input.constraints?.max_prompt_chars ?? 12000);
        const prompt = promptResult.prompt;
        const debateId = `debate_${sessionId}_${participants.join("_")}`;
        this.debateStore.start(debateId, sessionId, participants, input.maxRounds ?? 3);
        const cacheKey = `${sessionId}|${participants.join(",")}|${input.maxRounds ?? 3}|${prompt}`;
        const cached = this.debateCache.get(cacheKey);
        if (cached) {
            return {
                ...cached,
                requestId,
                debateId,
                routing: {
                    ...cached.routing,
                    reasonCodes: [...cached.routing.reasonCodes, "IDEMPOTENT_REPLAY"],
                },
            };
        }
        const responses = [];
        const used = new Set();
        for (const [index, participant] of participants.entries()) {
            used.add(participant);
            const primaryAdapter = this.registry.get(participant);
            let selectedBridge = participant;
            let response;
            try {
                response = await primaryAdapter.send({
                    command: "debate",
                    prompt,
                    maxRounds: input.maxRounds ?? 3,
                });
            }
            catch {
                const health = await this.registry.healthSnapshot();
                const reservedParticipants = new Set(participants.slice(index + 1));
                const fallbackBridge = this.registry
                    .list()
                    .find((bridge) => !used.has(bridge) && !reservedParticipants.has(bridge) && health[bridge]);
                if (!fallbackBridge) {
                    throw new CoreError("TOOL_ERROR", `debate participant ${participant} failed without fallback`);
                }
                used.add(fallbackBridge);
                selectedBridge = fallbackBridge;
                const fallbackAdapter = this.registry.get(fallbackBridge);
                response = await fallbackAdapter.send({
                    command: "debate",
                    prompt,
                    maxRounds: input.maxRounds ?? 3,
                });
            }
            this.eventStore.append({
                request_id: requestId,
                command: "debate",
                bridge: selectedBridge,
                attempt_no: index + 1,
                routing_reason: selectedBridge === participant ? "HYBRID_ENFORCED" : "HYBRID_FALLBACK",
                latency_ms: response.latencyMs,
                token_total: response.inputTokens + response.outputTokens,
                status: "success",
            });
            this.sessionStore.setThread(sessionId, selectedBridge, `${selectedBridge}_${requestId}_${index + 1}`);
            responses.push({
                bridge: selectedBridge,
                model: this.registry.get(selectedBridge).model,
                text: response.text,
                tokenUsage: toTokenUsage(response.inputTokens, response.outputTokens),
                latencyMs: response.latencyMs,
                meteringSource: "estimated",
            });
            this.debateStore.appendMessage(debateId, {
                role: selectedBridge,
                text: response.text,
                round: index + 1,
                status: "completed",
            });
        }
        const { consensus, stanceSummary } = evaluateDebate(responses);
        this.debateStore.complete(debateId);
        const result = {
            requestId,
            debateId,
            status: "success",
            responses,
            totalTokenUsage: sumTokenUsage(responses),
            partialFailure: false,
            egressControl: "cli-managed",
            consensus,
            stanceSummary,
            routing: {
                selected: responses.map((response) => response.bridge),
                fallbackTried: [],
                reasonCodes: [
                    "HYBRID_ENFORCED",
                    ...(promptResult.redacted ? ["DLP_REDACTED"] : []),
                    ...(promptResult.truncated ? ["PROMPT_TRUNCATED"] : []),
                ],
            },
        };
        this.debateCache.set(cacheKey, result);
        return result;
    }
    getSessionStore() {
        return this.sessionStore;
    }
    getEventStore() {
        return this.eventStore;
    }
}
function evaluateDebate(responses) {
    const content = responses.map((response) => response.text.toLowerCase());
    const hasNegation = content.some((text) => text.includes(" not ") || text.includes(" 반대"));
    const consensus = hasNegation ? "conflict" : responses.length > 1 ? "mixed" : "agree";
    return {
        consensus,
        stanceSummary: `participants=${responses.map((r) => r.bridge).join(",")}; consensus=${consensus}`,
    };
}
function normalizePrompt(command, input) {
    if (command === "debate") {
        return input.question ?? input.prompt ?? "Debate topic is not provided.";
    }
    return input.prompt ?? "No prompt provided.";
}
function toTokenUsage(inputTokens, outputTokens) {
    return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd: 0,
    };
}
function sumTokenUsage(responses) {
    return responses.reduce((acc, response) => ({
        inputTokens: acc.inputTokens + response.tokenUsage.inputTokens,
        outputTokens: acc.outputTokens + response.tokenUsage.outputTokens,
        totalTokens: acc.totalTokens + response.tokenUsage.totalTokens,
        costUsd: acc.costUsd + response.tokenUsage.costUsd,
    }), { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0 });
}
//# sourceMappingURL=orchestrator.js.map