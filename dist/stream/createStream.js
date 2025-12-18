import { RTSKError } from "../types";
import { createTransportForDefinition } from "../transport";
export function createStream(definition) {
    let status = "idle";
    let active = false;
    const subscribers = new Set();
    let transport = null;
    function notifyStatus(newStatus) {
        if (status === newStatus) {
            return;
        }
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
    function notifyError(error) {
        notifyStatus("error");
        active = false;
        for (const sub of subscribers) {
            sub.onError?.(error);
        }
    }
    function notifyComplete() {
        notifyStatus("completed");
        active = false;
        for (const sub of subscribers) {
            sub.onComplete?.();
        }
    }
    function start(request) {
        if (active) {
            // nu facem restart implicit, utilizatorul știe să dea stop/start dacă vrea
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
                        // dacă hydration-ul reușește, suntem clar în streaming
                        if (status === "connecting") {
                            notifyStatus("streaming");
                        }
                        notifyNext(hydrated);
                    }
                    catch (e) {
                        const error = new RTSKError({
                            kind: "hydrate",
                            message: "Failed to hydrate stream payload",
                            cause: e,
                            statusBefore: status,
                        });
                        notifyError(error);
                    }
                },
                onError(error) {
                    notifyError(error);
                },
                onComplete() {
                    notifyComplete();
                },
            }, {
                payload,
                // momentan nu expunem AbortSignal extern; transport-urile își gestionează singure abort-ul
                signal: null,
            });
            // dacă nu a apucat încă să vină nimic, dar connect-ul a mers, considerăm că suntem „streaming”
            if (status === "connecting") {
                notifyStatus("streaming");
            }
        }
        catch (e) {
            const error = e instanceof RTSKError
                ? e
                : new RTSKError({
                    kind: "internal",
                    message: "Failed to start stream",
                    cause: e,
                    statusBefore: status,
                });
            notifyError(error);
        }
    }
    function stop() {
        if (!active && status !== "connecting" && status !== "streaming") {
            return;
        }
        active = false;
        if (transport) {
            try {
                transport.disconnect();
            }
            catch (e) {
                // dacă și la disconnect crapă ceva, îl tratăm ca internal error,
                // dar nu mai facem altceva cu stream-ul
                const error = new RTSKError({
                    kind: "internal",
                    message: "Error while disconnecting transport",
                    cause: e,
                    statusBefore: status,
                });
                for (const sub of subscribers) {
                    sub.onError?.(error);
                }
            }
        }
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
