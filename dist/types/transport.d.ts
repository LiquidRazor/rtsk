import type { RTSKError } from "./error";
export type StreamMode = "ndjson" | "sse" | "websocket";
export interface TransportConnectOptions {
    payload?: unknown;
    signal?: AbortSignal | null;
}
export interface TransportHandlers<TRaw> {
    onRaw(raw: TRaw): void;
    onError(error: RTSKError): void;
    onComplete(): void;
}
export interface Transport<TRaw = unknown> {
    connect(handlers: TransportHandlers<TRaw>, options?: TransportConnectOptions): void;
    disconnect(): void;
    send?(data: unknown): void;
}
//# sourceMappingURL=transport.d.ts.map