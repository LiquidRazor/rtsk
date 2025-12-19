/**
 * Lifecycle statuses reported by stream controllers.
 *
 * @public
 */
type RTSKStatus = "idle" | "connecting" | "streaming" | "completed" | "error" | "stopped";

/**
 * Discriminated union of error categories surfaced by the SDK.
 *
 * @public
 */
type RTSKErrorKind = "transport" | "hydrate" | "protocol" | "internal";
/**
 * Structured data used to construct {@link RTSKError} instances.
 *
 * @public
 */
interface RTSKErrorDetails {
    /** Classification of the error. */
    kind: RTSKErrorKind;
    /** Human-readable description of what went wrong. */
    message: string;
    /** Optional underlying error or diagnostic payload. */
    cause?: unknown;
    /** Controller status immediately prior to the error (when known). */
    statusBefore?: RTSKStatus;
}
/**
 * Custom error class used throughout the RTSK streaming toolkit.
 *
 * @remarks
 * Instances carry structured context such as error kind and the previous
 * controller status, enabling downstream handling and telemetry.
 *
 * @public
 */
declare class RTSKError extends Error {
    /** Classification of the error. */
    readonly kind: RTSKErrorKind;
    /** Optional underlying error or diagnostic payload. */
    readonly cause?: unknown;
    /** Controller status immediately prior to the error (when known). */
    readonly statusBefore?: RTSKStatus;
    constructor(details: RTSKErrorDetails);
}

/**
 * Event handlers for a stream subscription.
 *
 * @remarks
 * All handlers are optional. Register only what you need.
 *
 * @typeParam TResponse - The hydrated payload type delivered by the stream.
 *
 * @public
 */
interface StreamEventHandlers<TResponse> {
    /** Called for each hydrated message emitted by the stream. */
    onNext?(value: TResponse): void;
    /**
     * Called when the stream encounters an error.
     *
     * @remarks
     * Errors are reported as {@link RTSKError} instances and typically transition
     * the controller status to `"error"`.
     */
    onError?(error: RTSKError): void;
    /**
     * Called when the stream completes without errors.
     *
     * @remarks
     * Completion indicates the underlying transport ended naturally (e.g. the server
     * closed the connection after sending all data).
     */
    onComplete?(): void;
    /**
     * Called whenever the controller status changes.
     *
     * @remarks
     * Includes transitions to `"stopped"`, `"completed"`, and `"error"`.
     */
    onStatusChange?(status: RTSKStatus): void;
}
/**
 * A handle returned by {@link StreamController.subscribe}.
 *
 * @public
 */
interface StreamSubscription {
    /** Unregisters handlers and stops receiving stream events. */
    unsubscribe(): void;
}
/**
 * A controller that manages a streaming connection and distributes events to subscribers.
 *
 * @typeParam TRequest - Request payload used to initiate the stream (if applicable).
 * @typeParam TResponse - Hydrated payload type delivered to subscribers.
 *
 * @public
 */
interface StreamController<TRequest = unknown, TResponse = unknown> {
    /**
     * Starts the stream connection with an optional request payload.
     *
     * @remarks
     * If called while the stream is already active, the call may be ignored.
     */
    start(request?: TRequest): void;
    /**
     * Stops the stream connection.
     *
     * @remarks
     * Safe to call when inactive.
     */
    stop(): void;
    /** Returns the current controller status. */
    getStatus(): RTSKStatus;
    /** Indicates whether the underlying transport is currently active. */
    isActive(): boolean;
    /**
     * Registers event handlers and returns a subscription handle.
     *
     * @returns A subscription that can be used to {@link StreamSubscription.unsubscribe}.
     */
    subscribe(handlers: StreamEventHandlers<TResponse>): StreamSubscription;
}

/**
 * Supported streaming transport modes.
 *
 * @public
 */
type StreamMode = "ndjson" | "sse" | "websocket";
/**
 * Options provided to a transport when initiating a connection.
 *
 * @public
 */
interface TransportConnectOptions {
    /** Optional payload sent during connection setup (e.g., POST body). */
    payload?: unknown;
    /** External abort signal for transports that support cooperative cancellation. */
    signal?: AbortSignal | null;
}
/**
 * Handlers invoked by transport implementations as the stream progresses.
 *
 * @typeParam TRaw - Raw payload type emitted by the transport.
 *
 * @public
 */
interface TransportHandlers<TRaw> {
    /** Called whenever the transport receives a raw payload. */
    onRaw(raw: TRaw): void;
    /** Called when a transport-level or protocol-level error occurs. */
    onError(error: RTSKError): void;
    /** Called when the transport finishes cleanly. */
    onComplete(): void;
}
/**
 * Contract implemented by low-level transport drivers.
 *
 * @remarks
 * Methods are documented here so classes like {@link NdjsonTransport},
 * {@link SseTransport}, and {@link WebsocketTransport} inherit the API
 * documentation directly from the interface.
 *
 * @typeParam TRaw - Raw payload type emitted by the transport.
 *
 * @public
 */
interface Transport<TRaw = unknown> {
    /**
     * Initiates the transport connection and begins streaming data.
     *
     * @param handlers - Callback hooks invoked for raw payloads, errors, and completion.
     * @param options - Optional connection parameters such as payload and abort signal.
     */
    connect(handlers: TransportHandlers<TRaw>, options?: TransportConnectOptions): void;
    /**
     * Terminates the transport connection and releases underlying resources.
     */
    disconnect(): void;
    /**
     * Sends a message over the transport when supported (e.g., WebSocket).
     *
     * @param data - Data to be serialized and transmitted.
     */
    send?(data: unknown): void;
}

/**
 * Maps a consumer-facing request into a transport-compatible payload.
 *
 * @typeParam TRequest - Request payload accepted by the stream API.
 *
 * @public
 */
type RequestMapper<TRequest> = (request: TRequest) => unknown;
/**
 * Hydrates a raw transport payload into the consumer-facing response type.
 *
 * @typeParam TRaw - Raw payload type emitted by the transport.
 * @typeParam TResponse - Hydrated payload type delivered to subscribers.
 *
 * @public
 */
type ResponseHydrator<TRaw, TResponse> = (raw: TRaw) => TResponse;

/**
 * Common configuration shared by all stream definition variants.
 *
 * @typeParam TRequest - Shape of the request payload accepted by the stream.
 * @typeParam TRaw - Raw payload type emitted by the transport before hydration.
 * @typeParam TResponse - Hydrated payload type delivered to consumers.
 *
 * @public
 */
interface StreamBaseConfig<TRequest, TRaw, TResponse> {
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

/**
 * Definition for a newline-delimited JSON (NDJSON) stream.
 *
 * @remarks
 * The transport emits individual lines, each expected to be a valid JSON
 * document. Hydration is performed via {@link StreamBaseConfig.responseHydrator}.
 *
 * @typeParam TRequest - Shape of the request payload accepted by the stream.
 * @typeParam TRaw - Raw NDJSON object type before hydration.
 * @typeParam TResponse - Hydrated payload type delivered to consumers.
 *
 * @public
 */
interface NdjsonStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    /** Identifies the stream as NDJSON-based. */
    mode: "ndjson";
}

/**
 * Additional EventSource configuration for SSE streams.
 *
 * @public
 */
interface SseExtraConfig {
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
interface SseStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    /** Identifies the stream as EventSource-based. */
    mode: "sse";
    /** EventSource-specific options forwarded to the transport. */
    sseOptions?: SseExtraConfig;
}

/**
 * Additional WebSocket configuration for stream definitions.
 *
 * @public
 */
interface WebsocketExtraConfig {
    /** Optional subprotocols advertised during the WebSocket handshake. */
    protocols?: string[];
    /** Enables automatic reconnection when the socket closes unexpectedly. */
    autoReconnect?: boolean;
    /** Delay between reconnection attempts when {@link WebsocketExtraConfig.autoReconnect} is true. */
    reconnectDelayMs?: number;
}
/**
 * Definition for a WebSocket-based stream.
 *
 * @typeParam TRequest - Shape of the request payload accepted by the stream.
 * @typeParam TRaw - Raw payload type emitted before hydration.
 * @typeParam TResponse - Hydrated payload type delivered to consumers.
 *
 * @public
 */
interface WebsocketStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    /** Identifies the stream as WebSocket-based. */
    mode: "websocket";
    /** WebSocket-specific options forwarded to the transport. */
    wsOptions?: WebsocketExtraConfig;
}

/**
 * Union of all supported stream definition variants.
 *
 * @typeParam TRequest - Shape of the request payload accepted by the stream.
 * @typeParam TRaw - Raw payload type emitted before hydration.
 * @typeParam TResponse - Hydrated payload type delivered to consumers.
 *
 * @public
 */
type StreamDefinition<TRequest, TRaw, TResponse> = NdjsonStreamDefinition<TRequest, TRaw, TResponse> | SseStreamDefinition<TRequest, TRaw, TResponse> | WebsocketStreamDefinition<TRequest, TRaw, TResponse>;

/**
 * Runtime configuration for the NDJSON transport.
 *
 * @public
 */
type NdjsonTransportConfig = {
    /** Endpoint that exposes an NDJSON stream. */
    endpoint: string;
    /** HTTP headers sent with the request when applicable. */
    headers?: Record<string, string>;
    /** Query string parameters appended to the endpoint URL. */
    query?: Record<string, string | number | boolean | null | undefined>;
    /**
     * Optional client-side timeout used to abort the request if no response is
     * received within the allotted milliseconds.
     */
    timeoutMs?: number;
};
/**
 * Low-level NDJSON transport implementation.
 *
 * @remarks
 * This is an advanced API.
 * Most consumers should prefer {@link createStream}, which provides
 * a higher-level, protocol-agnostic interface with lifecycle management.
 *
 * This transport is exposed for advanced use cases such as custom
 * wiring, testing, or direct transport control.
 *
 * @public
 */
declare class NdjsonTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config;
    private abortController;
    private active;
    constructor(config: NdjsonTransportConfig);
    connect(handlers: TransportHandlers<TRaw>, options?: TransportConnectOptions): void;
    disconnect(): void;
}

/**
 * Runtime configuration for the SSE transport.
 *
 * @public
 */
type SseTransportConfig = {
    /** Endpoint that exposes an SSE-compatible stream. */
    endpoint: string;
    /** Query string parameters appended to the endpoint URL. */
    query?: Record<string, string | number | boolean | null | undefined>;
    /** Whether EventSource requests include credentials. */
    withCredentials?: boolean;
    /** Informational retry delay; the browser ultimately controls SSE retries. */
    retryIntervalMs?: number;
};
/**
 * Low-level SSE transport implementation.
 *
 * @remarks
 * This is an advanced API.
 * Most consumers should prefer {@link createStream}, which provides
 * a higher-level, protocol-agnostic interface with lifecycle management.
 *
 * This transport is exposed for advanced use cases such as custom
 * wiring, testing, or direct transport control.
 *
 * @public
 */
declare class SseTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config;
    private source;
    private active;
    constructor(config: SseTransportConfig);
    connect(handlers: TransportHandlers<TRaw>): void;
    disconnect(): void;
}

/**
 * Runtime configuration for the WebSocket transport.
 *
 * @public
 */
type WebsocketTransportConfig = {
    /** Endpoint that accepts WebSocket connections. */
    endpoint: string;
    /** Query string parameters appended to the endpoint URL. */
    query?: Record<string, string | number | boolean | null | undefined>;
    /** WebSocket subprotocols to advertise during the handshake. */
    protocols?: string[];
    /** Enables automatic reconnection after unexpected closure. */
    autoReconnect?: boolean;
    /** Delay between reconnection attempts when {@link WebsocketTransportConfig.autoReconnect} is true. */
    reconnectDelayMs?: number;
};
/**
 * Low-level WebSocket transport implementation.
 *
 * @remarks
 * This is an advanced API.
 * Most consumers should prefer {@link createStream}, which provides
 * a higher-level, protocol-agnostic interface with lifecycle management.
 *
 * This transport is exposed for advanced use cases such as custom
 * wiring, testing, or direct transport control.
 *
 * @public
 */
declare class WebsocketTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config;
    private socket;
    private handlers;
    private active;
    private manualClose;
    constructor(config: WebsocketTransportConfig);
    connect(handlers: TransportHandlers<TRaw>): void;
    private openSocket;
    disconnect(): void;
    send(data: unknown): void;
}

/**
 * Creates a stream controller for managing client-side streaming connections.
 *
 * @remarks
 * This factory function creates a {@link StreamController} that manages the lifecycle
 * of a streaming connection and distributes events to subscribers.
 *
 * Status transitions typically include:
 * - `idle` → `connecting` → `streaming`
 * - `streaming` → `completed` (natural end)
 * - `streaming` → `error` (failure)
 * - `*` → `stopped` (manual stop)
 *
 * The controller supports multiple subscribers and notifies them of:
 * - status changes (`onStatusChange`)
 * - hydrated messages (`onNext`)
 * - errors (`onError`)
 * - completion (`onComplete`)
 *
 * @typeParam TRequest - Request payload used to initiate the stream (if applicable)
 * @typeParam TRaw - Raw payload type received from the transport layer
 * @typeParam TResponse - Hydrated payload type delivered to subscribers
 *
 * @param definition - Stream configuration defining transport mode, endpoint,
 * request mapping, and response hydration
 *
 * @returns A {@link StreamController} instance with lifecycle and subscription helpers
 *
 * @example
 * ```ts
 * const controller = createStream({
 *   mode: "ndjson",
 *   endpoint: "https://api.example.com/stream",
 *   requestMapper: (req) => req,
 *   responseHydrator: (raw) => raw,
 * });
 *
 * const sub = controller.subscribe({
 *   onStatusChange: (s) => console.log("Status:", s),
 *   onNext: (v) => console.log("Next:", v),
 *   onError: (e) => console.error("Error:", e),
 *   onComplete: () => console.log("Complete"),
 * });
 *
 * controller.start({ query: "example" });
 * // later...
 * controller.stop();
 * sub.unsubscribe();
 * ```
 *
 * @public
 */
declare function createStream<TRequest, TRaw, TResponse>(definition: StreamDefinition<TRequest, TRaw, TResponse>): StreamController<TRequest, TResponse>;

export { type NdjsonStreamDefinition, NdjsonTransport, type NdjsonTransportConfig, RTSKError, type RTSKErrorDetails, type RTSKErrorKind, type RTSKStatus, type RequestMapper, type ResponseHydrator, type SseExtraConfig, type SseStreamDefinition, SseTransport, type SseTransportConfig, type StreamBaseConfig, type StreamController, type StreamDefinition, type StreamEventHandlers, type StreamMode, type StreamSubscription, type Transport, type TransportConnectOptions, type TransportHandlers, type WebsocketExtraConfig, type WebsocketStreamDefinition, WebsocketTransport, type WebsocketTransportConfig, createStream };
