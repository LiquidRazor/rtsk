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
export declare function createStream<TRequest, TRaw, TResponse>(definition: StreamDefinition<TRequest, TRaw, TResponse>): StreamController<TRequest, TResponse>;

/**
 * For NDJSON, TRaw is usually an object, but we keep it generic.
 */
export declare interface NdjsonStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: "ndjson";
}

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
export declare class NdjsonTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config;
    private abortController;
    private active;
    constructor(config: NdjsonTransportConfig);
    connect(handlers: TransportHandlers<TRaw>, options?: TransportConnectOptions): void;
    disconnect(): void;
}

export declare type NdjsonTransportConfig = {
    endpoint: string;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean | null | undefined>;
    timeoutMs?: number;
};

export declare type RequestMapper<TRequest> = (request: TRequest) => unknown;

export declare type ResponseHydrator<TRaw, TResponse> = (raw: TRaw) => TResponse;

export declare class RTSKError extends Error {
    readonly kind: RTSKErrorKind;
    readonly cause?: unknown;
    readonly statusBefore?: RTSKStatus;
    constructor(details: RTSKErrorDetails);
}

export declare interface RTSKErrorDetails {
    kind: RTSKErrorKind;
    message: string;
    cause?: unknown;
    statusBefore?: RTSKStatus;
}

export declare type RTSKErrorKind = "transport" | "hydrate" | "protocol" | "internal";

export declare type RTSKStatus = "idle" | "connecting" | "streaming" | "completed" | "error" | "stopped";

export declare interface SseExtraConfig {
    withCredentials?: boolean;
    retryIntervalMs?: number;
}

export declare interface SseStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: "sse";
    sseOptions?: SseExtraConfig;
}

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
export declare class SseTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config;
    private source;
    private active;
    constructor(config: SseTransportConfig);
    connect(handlers: TransportHandlers<TRaw>): void;
    disconnect(): void;
}

export declare type SseTransportConfig = {
    endpoint: string;
    query?: Record<string, string | number | boolean | null | undefined>;
    withCredentials?: boolean;
    retryIntervalMs?: number;
};

/**
 * Generic config applicable for any stream (ndjson, sse, websocket)
 */
export declare interface StreamBaseConfig<TRequest, TRaw, TResponse> {
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

/**
 * A controller that manages a streaming connection and distributes events to subscribers.
 *
 * @typeParam TRequest - Request payload used to initiate the stream (if applicable).
 * @typeParam TResponse - Hydrated payload type delivered to subscribers.
 *
 * @public
 */
export declare interface StreamController<TRequest = unknown, TResponse = unknown> {
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

export declare type StreamDefinition<TRequest, TRaw, TResponse> = NdjsonStreamDefinition<TRequest, TRaw, TResponse> | SseStreamDefinition<TRequest, TRaw, TResponse> | WebsocketStreamDefinition<TRequest, TRaw, TResponse>;

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
export declare interface StreamEventHandlers<TResponse> {
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

export declare type StreamMode = "ndjson" | "sse" | "websocket";

/**
 * A handle returned by {@link StreamController.subscribe}.
 *
 * @public
 */
export declare interface StreamSubscription {
    /** Unregisters handlers and stops receiving stream events. */
    unsubscribe(): void;
}

export declare interface Transport<TRaw = unknown> {
    connect(handlers: TransportHandlers<TRaw>, options?: TransportConnectOptions): void;
    disconnect(): void;
    send?(data: unknown): void;
}

export declare interface TransportConnectOptions {
    payload?: unknown;
    signal?: AbortSignal | null;
}

export declare interface TransportHandlers<TRaw> {
    onRaw(raw: TRaw): void;
    onError(error: RTSKError): void;
    onComplete(): void;
}

export declare interface WebsocketExtraConfig {
    protocols?: string[];
    autoReconnect?: boolean;
    reconnectDelayMs?: number;
}

export declare interface WebsocketStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: "websocket";
    wsOptions?: WebsocketExtraConfig;
}

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
export declare class WebsocketTransport<TRaw = unknown> implements Transport<TRaw> {
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

export declare type WebsocketTransportConfig = {
    endpoint: string;
    query?: Record<string, string | number | boolean | null | undefined>;
    protocols?: string[];
    autoReconnect?: boolean;
    reconnectDelayMs?: number;
};

export { }
