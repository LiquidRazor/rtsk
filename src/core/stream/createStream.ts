import type {RTSKStatus, StreamController, StreamEventHandlers, StreamSubscription, Transport,} from "../types";
import {RTSKError} from "../types";
import type {StreamDefinition} from "../definitions";
import {createTransportForDefinition} from "../transport";

export function createStream<TRequest, TRaw, TResponse>(
    definition: StreamDefinition<TRequest, TRaw, TResponse>
): StreamController<TRequest, TResponse> {
    let status: RTSKStatus = "idle";
    let active = false;

    const subscribers = new Set<StreamEventHandlers<TResponse>>();
    let transport: Transport<TRaw> | null = null;

    function notifyStatus(newStatus: RTSKStatus): void {
        if (status === newStatus) {
            return;
        }
        status = newStatus;
        for (const sub of subscribers) {
            sub.onStatusChange?.(status);
        }
    }

    function notifyNext(value: TResponse): void {
        for (const sub of subscribers) {
            sub.onNext?.(value);
        }
    }

    function notifyError(error: RTSKError): void {
        notifyStatus("error");
        active = false;

        for (const sub of subscribers) {
            sub.onError?.(error);
        }
    }

    function notifyComplete(): void {
        notifyStatus("completed");
        active = false;

        for (const sub of subscribers) {
            sub.onComplete?.();
        }
    }

    function start(request?: TRequest): void {
        if (active) {
            // nu facem restart implicit, utilizatorul știe să dea stop/start dacă vrea
            return;
        }

        active = true;
        notifyStatus("connecting");

        transport = createTransportForDefinition<TRaw>(definition);

        const payload =
            definition.requestMapper && request !== undefined
                ? definition.requestMapper(request)
                : request;

        try {
            transport.connect(
                {
                    onRaw(raw: TRaw): void {
                        try {
                            const hydrated = definition.responseHydrator(raw);
                            // dacă hydration-ul reușește, suntem clar în streaming
                            if (status === "connecting") {
                                notifyStatus("streaming");
                            }
                            notifyNext(hydrated);
                        } catch (e) {
                            const error = new RTSKError({
                                kind: "hydrate",
                                message: "Failed to hydrate stream payload",
                                cause: e,
                                statusBefore: status,
                            });
                            notifyError(error);
                        }
                    },
                    onError(error: RTSKError): void {
                        notifyError(error);
                    },
                    onComplete(): void {
                        notifyComplete();
                    },
                },
                {
                    payload,
                    // momentan nu expunem AbortSignal extern; transport-urile își gestionează singure abort-ul
                    signal: null,
                }
            );

            // dacă nu a apucat încă să vină nimic, dar connect-ul a mers, considerăm că suntem „streaming”
            if (status === "connecting") {
                notifyStatus("streaming");
            }
        } catch (e) {
            const error =
                e instanceof RTSKError
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

    function stop(): void {
        if (!active && status !== "connecting" && status !== "streaming") {
            return;
        }

        active = false;

        if (transport) {
            try {
                transport.disconnect();
            } catch (e) {
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

    function subscribe(
        handlers: StreamEventHandlers<TResponse>
    ): StreamSubscription {
        subscribers.add(handlers);

        return {
            unsubscribe(): void {
                subscribers.delete(handlers);
            },
        };
    }

    return {
        start,
        stop,
        getStatus(): RTSKStatus {
            return status;
        },
        isActive(): boolean {
            return active;
        },
        subscribe,
    };
}
