import type { Transport, TransportHandlers } from "../types";
interface WebsocketTransportConfig {
    endpoint: string;
    query?: Record<string, string | number | boolean | null | undefined>;
    protocols?: string[];
    autoReconnect?: boolean;
    reconnectDelayMs?: number;
}
export declare class WebsocketTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config;
    private socket;
    private handlers;
    private active;
    private manualClose;
    constructor(config: WebsocketTransportConfig);
    connect(handlers: TransportHandlers<TRaw>): void;
    private openSocket;
    disconnect(): void;
    send(data: unknown): void;
}
export {};
//# sourceMappingURL=websocket.d.ts.map