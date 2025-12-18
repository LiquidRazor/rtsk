import type { RTSKStatus } from "./status";
export type RTSKErrorKind = "transport" | "hydrate" | "protocol" | "internal";
export interface RTSKErrorDetails {
    kind: RTSKErrorKind;
    message: string;
    cause?: unknown;
    statusBefore?: RTSKStatus;
}
export declare class RTSKError extends Error {
    readonly kind: RTSKErrorKind;
    readonly cause?: unknown;
    readonly statusBefore?: RTSKStatus;
    constructor(details: RTSKErrorDetails);
}
//# sourceMappingURL=error.d.ts.map