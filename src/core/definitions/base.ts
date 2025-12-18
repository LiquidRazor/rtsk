import type {
    StreamMode,
    RequestMapper,
    ResponseHydrator,
} from "../types";

/**
 * Generic config applicable for any stream (ndjson, sse, websocket)
 */
export interface StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: StreamMode;

    endpoint: string;

    // Generic network options
    transportOptions?: {
        headers?: Record<string, string>;
        query?: Record<string, string | number | boolean | null | undefined>;
        timeoutMs?: number;
    };

    // Transforms the user's request into a transport-friendly shape
    requestMapper?: RequestMapper<TRequest>;

    // Transforms raw values into the final object
    responseHydrator: ResponseHydrator<TRaw, TResponse>;

    // Optional metadata for logging / debug / audit
    meta?: Record<string, unknown>;
}
