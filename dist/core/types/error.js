/**
 * Custom error class used throughout the RTSK streaming toolkit.
 *
 * @remarks
 * Instances carry structured context such as error kind and the previous
 * controller status, enabling downstream handling and telemetry.
 *
 * @public
 */
export class RTSKError extends Error {
    /** Classification of the error. */
    kind;
    /** Optional underlying error or diagnostic payload. */
    cause;
    /** Controller status immediately prior to the error (when known). */
    statusBefore;
    constructor(details) {
        super(details.message);
        this.name = "RTSKError";
        this.kind = details.kind;
        this.cause = details.cause;
        this.statusBefore = details.statusBefore;
    }
}
