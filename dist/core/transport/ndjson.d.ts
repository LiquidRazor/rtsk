import type { Transport, TransportHandlers, TransportConnectOptions } from "../types";
export type NdjsonTransportConfig = {
    endpoint: string;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean | null | undefined>;
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