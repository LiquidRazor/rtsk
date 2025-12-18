import type { StreamBaseConfig } from "./base";
export interface WebsocketExtraConfig {
    protocols?: string[];
    autoReconnect?: boolean;
    reconnectDelayMs?: number;
}
export interface WebsocketStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: "websocket";
    wsOptions?: WebsocketExtraConfig;
}
//# sourceMappingURL=websocket.d.ts.map