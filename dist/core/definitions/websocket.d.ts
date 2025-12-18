import type { StreamBaseConfig } from "./base";
/**
 * Additional WebSocket configuration for stream definitions.
 *
 * @public
 */
export interface WebsocketExtraConfig {
    /** Optional subprotocols advertised during the WebSocket handshake. */
    protocols?: string[];
    /** Enables automatic reconnection when the socket closes unexpectedly. */
    autoReconnect?: boolean;
    /** Delay between reconnection attempts when {@link WebsocketExtraConfig.autoReconnect} is true. */
    reconnectDelayMs?: number;
}
/**
 * Definition for a WebSocket-based stream.
 *
 * @typeParam TRequest - Shape of the request payload accepted by the stream.
 * @typeParam TRaw - Raw payload type emitted before hydration.
 * @typeParam TResponse - Hydrated payload type delivered to consumers.
 *
 * @public
 */
export interface WebsocketStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    /** Identifies the stream as WebSocket-based. */
    mode: "websocket";
    /** WebSocket-specific options forwarded to the transport. */
    wsOptions?: WebsocketExtraConfig;
}
//# sourceMappingURL=websocket.d.ts.map