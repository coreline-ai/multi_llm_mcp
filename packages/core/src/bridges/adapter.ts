import type { BridgeName, ToolCommand } from "../types.js";

export interface BridgeSendInput {
  command: ToolCommand;
  prompt: string;
  maxRounds: number;
}

export interface BridgeAdapter {
  readonly name: BridgeName;
  readonly model: string;
  healthCheck(): Promise<boolean>;
  send(input: BridgeSendInput): Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
  }>;
  resume(
    threadId: string,
    input: BridgeSendInput,
  ): Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
  }>;
}
