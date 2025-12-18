import type { StreamController } from "../types";
import type { StreamDefinition } from "../definitions";
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
//# sourceMappingURL=createStream.d.ts.map