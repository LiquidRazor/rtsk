import type {
    StreamMode,
    RequestMapper,
    ResponseHydrator,
} from "../types";

/**
 * Config generic valabil pentru orice stream (ndjson, sse, websocket)
 */
export interface StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: StreamMode;

    endpoint: string;

    // opțiuni generice de rețea
    transportOptions?: {
        headers?: Record<string, string>;
        query?: Record<string, string | number | boolean | null | undefined>;
        timeoutMs?: number;
    };

    // transformă request-ul userului într-o formă digerabilă de transport
    requestMapper?: RequestMapper<TRequest>;

    // transformă valorile brute în obiectul final
    responseHydrator: ResponseHydrator<TRaw, TResponse>;

    // opțional: metadata pentru logging / debug / audit
    meta?: Record<string, unknown>;
}
