import type { StreamBaseConfig } from "./base";
export interface SseExtraConfig {
    withCredentials?: boolean;
    retryIntervalMs?: number;
}
export interface SseStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: "sse";
    sseOptions?: SseExtraConfig;
}
//# sourceMappingURL=sse.d.ts.map