import type { Transport, TransportHandlers } from "../types";
export type WebsocketTransportConfig = {
    endpoint: string;
    query?: Record<string, string | number | boolean | null | undefined>;
    protocols?: string[];
    autoReconnect?: boolean;
    reconnectDelayMs?: number;
};
/**
 * Low-level WebSocket transport implementation.
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
//# sourceMappingURL=websocket.d.ts.map