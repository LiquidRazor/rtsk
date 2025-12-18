import type { Transport, TransportHandlers } from "../types";
export type SseTransportConfig = {
    endpoint: string;
    query?: Record<string, string | number | boolean | null | undefined>;
    withCredentials?: boolean;
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