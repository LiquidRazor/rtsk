import type { StreamBaseConfig } from "./base";

export interface WebsocketExtraConfig {
    protocols?: string[];        // ex: ["json"]
    autoReconnect?: boolean;     // default false
    reconnectDelayMs?: number;   // for exponential backoff more later
}

export interface WebsocketStreamDefinition<TRequest, TRaw, TResponse>
    extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: "websocket";
    wsOptions?: WebsocketExtraConfig;
}
