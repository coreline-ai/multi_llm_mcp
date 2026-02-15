export interface PromptPipelineResult {
    prompt: string;
    redacted: boolean;
    truncated: boolean;
}
export declare function sanitizePrompt(prompt: string, maxChars?: number): PromptPipelineResult;
//# sourceMappingURL=dlp.d.ts.map