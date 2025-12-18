import type { StreamBaseConfig } from "./base";

export interface SseExtraConfig {
    withCredentials?: boolean;
    retryIntervalMs?: number; // default EventSource retry
}

export interface SseStreamDefinition<TRequest, TRaw, TResponse>
    extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: "sse";
    sseOptions?: SseExtraConfig;
}
