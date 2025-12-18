import type { Transport, TransportHandlers } from "../types";
/**
 * Runtime configuration for the SSE transport.
 *
 * @public
 */
export type SseTransportConfig = {
    /** Endpoint that exposes an SSE-compatible stream. */
    endpoint: string;
    /** Query string parameters appended to the endpoint URL. */
    query?: Record<string, string | number | boolean | null | undefined>;
    /** Whether EventSource requests include credentials. */
    withCredentials?: boolean;
    /** Informational retry delay; the browser ultimately controls SSE retries. */
    retryIntervalMs?: number;
};
/**
 * Low-level SSE transport implementation.
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
export declare class SseTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config;
    private source;
    private active;
    constructor(config: SseTransportConfig);
    connect(handlers: TransportHandlers<TRaw>): void;
    disconnect(): void;
}
//# sourceMappingURL=sse.d.ts.map