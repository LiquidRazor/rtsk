import type { StreamBaseConfig } from "./base";
/**
 * Additional EventSource configuration for SSE streams.
 *
 * @public
 */
export interface SseExtraConfig {
    /** Whether cookies and HTTP credentials are sent with the EventSource. */
    withCredentials?: boolean;
    /** Optional override for the server-provided reconnection delay. */
    retryIntervalMs?: number;
}
/**
 * Definition for a Server-Sent Events (SSE) stream.
 *
 * @typeParam TRequest - Shape of the request payload accepted by the stream.
 * @typeParam TRaw - Raw payload type emitted before hydration.
 * @typeParam TResponse - Hydrated payload type delivered to consumers.
 *
 * @public
 */
export interface SseStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    /** Identifies the stream as EventSource-based. */
    mode: "sse";
    /** EventSource-specific options forwarded to the transport. */
    sseOptions?: SseExtraConfig;
}
//# sourceMappingURL=sse.d.ts.map