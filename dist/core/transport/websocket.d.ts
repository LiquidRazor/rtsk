import type { Transport, TransportHandlers } from "../types";
/**
 * Runtime configuration for the WebSocket transport.
 *
 * @public
 */
export type WebsocketTransportConfig = {
    /** Endpoint that accepts WebSocket connections. */
    endpoint: string;
    /** Query string parameters appended to the endpoint URL. */
    query?: Record<string, string | number | boolean | null | undefined>;
    /** WebSocket subprotocols to advertise during the handshake. */
    protocols?: string[];
    /** Enables automatic reconnection after unexpected closure. */
    autoReconnect?: boolean;
    /** Delay between reconnection attempts when {@link autoReconnect} is true. */
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