import type { Transport, TransportHandlers, TransportConnectOptions } from "../types";
interface NdjsonTransportConfig {
    endpoint: string;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean | null | undefined>;
    timeoutMs?: number;
}
export declare class NdjsonTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config;
    private abortController;
    private active;
    constructor(config: NdjsonTransportConfig);
    connect(handlers: TransportHandlers<TRaw>, options?: TransportConnectOptions): void;
    disconnect(): void;
}
export {};
//# sourceMappingURL=ndjson.d.ts.map