import type { StreamMode, RequestMapper, ResponseHydrator } from "../types";
/**
 * Generic config applicable for any stream (ndjson, sse, websocket)
 */
export interface StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: StreamMode;
    endpoint: string;
    transportOptions?: {
        headers?: Record<string, string>;
        query?: Record<string, string | number | boolean | null | undefined>;
        timeoutMs?: number;
    };
    requestMapper?: RequestMapper<TRequest>;
    responseHydrator: ResponseHydrator<TRaw, TResponse>;
    meta?: Record<string, unknown>;
}
//# sourceMappingURL=base.d.ts.map