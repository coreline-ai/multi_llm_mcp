import { CoreError } from "../errors.js";

const SECRET_PATTERNS: RegExp[] = [
  /sk-[a-zA-Z0-9]{20,}/g,
  /ghp_[a-zA-Z0-9]{20,}/g,
  /AIza[0-9A-Za-z\-_]{20,}/g,
  /(api[_-]?key\s*[:=]\s*)([A-Za-z0-9\-_]{12,})/gi,
];

export interface PromptPipelineResult {
  prompt: string;
  redacted: boolean;
  truncated: boolean;
}

export function sanitizePrompt(prompt: string, maxChars = 12000): PromptPipelineResult {
  if (!prompt.trim()) {
    throw new CoreError("VALIDATION_ERROR", "prompt or question is required");
  }

  let redacted = false;
  let transformed = prompt;
  for (const pattern of SECRET_PATTERNS) {
    transformed = transformed.replace(pattern, (...groups) => {
      redacted = true;
      if (groups.length >= 3) {
        return `${groups[1]}[REDACTED]`;
      }
      return "[REDACTED]";
    });
  }

  const truncated = transformed.length > maxChars;
  if (truncated) {
    transformed = `${transformed.slice(0, maxChars)}\n...[TRUNCATED]`;
  }

  return {
    prompt: transformed,
    redacted,
    truncated,
  };
}
