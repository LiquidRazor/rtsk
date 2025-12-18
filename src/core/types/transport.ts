import type { RTSKError } from "./error";

/**
 * Supported streaming transport modes.
 *
 * @public
 */
export type StreamMode = "ndjson" | "sse" | "websocket";

/**
 * Options provided to a transport when initiating a connection.
 *
 * @public
 */
export interface TransportConnectOptions {
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
export interface TransportHandlers<TRaw> {
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
export interface Transport<TRaw = unknown> {
  /**
   * Initiates the transport connection and begins streaming data.
   *
   * @param handlers - Callback hooks invoked for raw payloads, errors, and completion.
   * @param options - Optional connection parameters such as payload and abort signal.
   */
  connect(
    handlers: TransportHandlers<TRaw>,
    options?: TransportConnectOptions
  ): void;

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
