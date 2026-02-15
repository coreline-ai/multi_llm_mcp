import type { ErrorCode } from "./types.js";
export declare class CoreError extends Error {
    readonly code: ErrorCode;
    constructor(code: ErrorCode, message: string);
}
//# sourceMappingURL=errors.d.ts.map