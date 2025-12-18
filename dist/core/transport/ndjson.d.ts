import type { Transport, TransportHandlers, TransportConnectOptions } from "../types";
/**
 * Runtime configuration for the NDJSON transport.
 *
 * @public
 */
export type NdjsonTransportConfig = {
    /** Endpoint that exposes an NDJSON stream. */
    endpoint: string;
    /** HTTP headers sent with the request when applicable. */
    headers?: Record<string, string>;
    /** Query string parameters appended to the endpoint URL. */
    query?: Record<string, string | number | boolean | null | undefined>;
    /**
     * Optional client-side timeout used to abort the request if no response is
     * received within the allotted milliseconds.
     */
    timeoutMs?: number;
};
/**
 * Low-level NDJSON transport implementation.
 *
 * @remarks
 * This is an advanced API.
 * Most consumers should prefer {@link createStream}, which provides
 * a higher-level, protocol-agnostic interface with lifecycle management.
 *
 * This transport is exposed for advanced use cases such as custom
 * wiring, testing, or direct transport control.
 *
 * @public
 */
export declare class NdjsonTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config;
    private abortController;
    private active;
    constructor(config: NdjsonTransportConfig);
    connect(handlers: TransportHandlers<TRaw>, options?: TransportConnectOptions): void;
    disconnect(): void;
}
//# sourceMappingURL=ndjson.d.ts.map