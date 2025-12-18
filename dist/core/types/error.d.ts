import type { RTSKStatus } from "./status";
/**
 * Discriminated union of error categories surfaced by the SDK.
 *
 * @public
 */
export type RTSKErrorKind = "transport" | "hydrate" | "protocol" | "internal";
/**
 * Structured data used to construct {@link RTSKError} instances.
 *
 * @public
 */
export interface RTSKErrorDetails {
    /** Classification of the error. */
    kind: RTSKErrorKind;
    /** Human-readable description of what went wrong. */
    message: string;
    /** Optional underlying error or diagnostic payload. */
    cause?: unknown;
    /** Controller status immediately prior to the error (when known). */
    statusBefore?: RTSKStatus;
}
/**
 * Custom error class used throughout the RTSK streaming toolkit.
 *
 * @remarks
 * Instances carry structured context such as error kind and the previous
 * controller status, enabling downstream handling and telemetry.
 *
 * @public
 */
export declare class RTSKError extends Error {
    /** Classification of the error. */
    readonly kind: RTSKErrorKind;
    /** Optional underlying error or diagnostic payload. */
    readonly cause?: unknown;
    /** Controller status immediately prior to the error (when known). */
    readonly statusBefore?: RTSKStatus;
    constructor(details: RTSKErrorDetails);
}
//# sourceMappingURL=error.d.ts.map