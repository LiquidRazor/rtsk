import type { RTSKStatus } from "./status";
import type { RTSKError } from "./error";

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
export interface StreamEventHandlers<TResponse> {
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
export interface StreamSubscription {
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
export interface StreamController<TRequest = unknown, TResponse = unknown> {
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
