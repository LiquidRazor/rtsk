import { RTSKError } from "../types";
import { createTransportForDefinition } from "../transport/factory";
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
export function createStream(definition) {
    let status = "idle";
    let active = false;
    const subscribers = new Set();
    let transport = null;
    function notifyStatus(newStatus) {
        if (status === newStatus)
            return;
        status = newStatus;
        for (const sub of subscribers) {
            sub.onStatusChange?.(status);
        }
    }
    function notifyNext(value) {
        for (const sub of subscribers) {
            sub.onNext?.(value);
        }
    }
    function disconnectTransportSafely(reason) {
        if (!transport)
            return;
        try {
            transport.disconnect();
        }
        catch (e) {
            // On stop, we already report disconnect failures (see stop()).
            // On error/complete, avoid overwriting the primary error/completion signal.
            if (reason === "stop") {
                const err = new RTSKError({
                    kind: "internal",
                    message: "Error while disconnecting transport",
                    cause: e,
                    statusBefore: status,
                });
                for (const sub of subscribers) {
                    sub.onError?.(err);
                }
            }
        }
        finally {
            transport = null;
        }
    }
    function notifyError(error) {
        // Ensure underlying resources are closed before broadcasting.
        disconnectTransportSafely("error");
        notifyStatus("error");
        active = false;
        for (const sub of subscribers) {
            sub.onError?.(error);
        }
    }
    function notifyComplete() {
        // Ensure underlying resources are closed before broadcasting.
        disconnectTransportSafely("complete");
        notifyStatus("completed");
        active = false;
        for (const sub of subscribers) {
            sub.onComplete?.();
        }
    }
    function start(request) {
        if (active) {
            // No implicit restart. Consumer controls stop/start.
            return;
        }
        active = true;
        notifyStatus("connecting");
        transport = createTransportForDefinition(definition);
        const payload = definition.requestMapper && request !== undefined
            ? definition.requestMapper(request)
            : request;
        try {
            transport.connect({
                onRaw(raw) {
                    try {
                        const hydrated = definition.responseHydrator(raw);
                        // First successfully hydrated payload implies real streaming.
                        if (status === "connecting") {
                            notifyStatus("streaming");
                        }
                        notifyNext(hydrated);
                    }
                    catch (e) {
                        notifyError(new RTSKError({
                            kind: "hydrate",
                            message: "Failed to hydrate stream payload",
                            cause: e,
                            statusBefore: status,
                        }));
                    }
                },
                onError(err) {
                    notifyError(err);
                },
                onComplete() {
                    notifyComplete();
                },
            }, {
                payload,
                // Not exposing external AbortSignal for now; transports manage abort internally.
                signal: null,
            });
            // If connect succeeded but no data arrived yet, treat as streaming-ready.
            if (status === "connecting") {
                notifyStatus("streaming");
            }
        }
        catch (e) {
            notifyError(e instanceof RTSKError
                ? e
                : new RTSKError({
                    kind: "internal",
                    message: "Failed to start stream",
                    cause: e,
                    statusBefore: status,
                }));
        }
    }
    function stop() {
        // If inactive and not in a connecting/streaming phase, no-op.
        if (!active && status !== "connecting" && status !== "streaming") {
            return;
        }
        active = false;
        // On stop, we *do* report disconnect failures to subscribers (internal error),
        // but we still transition to "stopped" afterward.
        disconnectTransportSafely("stop");
        notifyStatus("stopped");
    }
    function subscribe(handlers) {
        subscribers.add(handlers);
        return {
            unsubscribe() {
                subscribers.delete(handlers);
            },
        };
    }
    return {
        start,
        stop,
        getStatus() {
            return status;
        },
        isActive() {
            return active;
        },
        subscribe,
    };
}
