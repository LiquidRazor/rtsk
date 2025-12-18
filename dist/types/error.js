export class RTSKError extends Error {
    kind;
    cause;
    statusBefore;
    constructor(details) {
        super(details.message);
        this.name = "RTSKError";
        this.kind = details.kind;
        this.cause = details.cause;
        this.statusBefore = details.statusBefore;
    }
}
