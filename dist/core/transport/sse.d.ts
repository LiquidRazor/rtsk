import type { Transport, TransportHandlers } from "../types";
interface SseTransportConfig {
    endpoint: string;
    query?: Record<string, string | number | boolean | null | undefined>;
    withCredentials?: boolean;
    retryIntervalMs?: number;
}
export declare class SseTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config;
    private source;
    private active;
    constructor(config: SseTransportConfig);
    connect(handlers: TransportHandlers<TRaw>): void;
    disconnect(): void;
}
export {};
//# sourceMappingURL=sse.d.ts.map