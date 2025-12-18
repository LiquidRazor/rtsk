import type {
    StreamMode,
    RequestMapper,
    ResponseHydrator,
} from "../types";

/**
 * Common configuration shared by all stream definition variants.
 *
 * @typeParam TRequest - Shape of the request payload accepted by the stream.
 * @typeParam TRaw - Raw payload type emitted by the transport before hydration.
 * @typeParam TResponse - Hydrated payload type delivered to consumers.
 *
 * @public
 */
export interface StreamBaseConfig<TRequest, TRaw, TResponse> {
    /**
     * Streaming protocol used by the definition.
     */
    mode: StreamMode;

    /**
     * Target endpoint (URL or path) used by the underlying transport.
     */
    endpoint: string;

    /**
     * Optional network settings applied by the transport implementation.
     */
    transportOptions?: {
        /** HTTP headers forwarded to the transport when applicable. */
        headers?: Record<string, string>;
        /** Query parameters appended to the endpoint URL. */
        query?: Record<string, string | number | boolean | null | undefined>;
        /** Client-side timeout for establishing or maintaining the stream. */
        timeoutMs?: number;
    };

    /**
     * Transforms the consumer-facing request into a transport-friendly payload.
     */
    requestMapper?: RequestMapper<TRequest>;

    /**
     * Hydrates raw transport values into the final response type.
     */
    responseHydrator: ResponseHydrator<TRaw, TResponse>;

    /**
     * Free-form metadata for logging, debugging, or auditing purposes.
     */
    meta?: Record<string, unknown>;
}
