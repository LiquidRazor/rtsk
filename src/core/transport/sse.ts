import { RTSKError } from "../types";
import type { Transport, TransportHandlers } from "../types";

export type  SseTransportConfig = {
    endpoint: string;
    query?: Record<string, string | number | boolean | null | undefined>;
    withCredentials?: boolean;
    retryIntervalMs?: number; // Informational only; EventSource handles its own retry
}

function buildUrl(endpoint: string, query?: SseTransportConfig["query"]): string {
    if (!query || Object.keys(query).length === 0) {
        return endpoint;
    }

    const url = new URL(endpoint, window.location.origin);
    Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }
        url.searchParams.set(key, String(value));
    });

    return url.toString();
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

export class SseTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config: SseTransportConfig;
    private source: EventSource | null = null;
    private active = false;

    constructor(config: SseTransportConfig) {
        this.config = config;
    }

    connect(handlers: TransportHandlers<TRaw>): void {
        if (this.active) {
            return;
        }

        this.active = true;

        const url = buildUrl(this.config.endpoint, this.config.query);

        const source = new EventSource(url, {
            withCredentials: Boolean(this.config.withCredentials),
        });

        this.source = source;

        source.onmessage = (ev: MessageEvent) => {
            try {
                const raw = JSON.parse(ev.data) as TRaw;
                handlers.onRaw(raw);
            } catch (e) {
                handlers.onError(
                    new RTSKError({
                        kind: "protocol",
                        message: "Invalid SSE message payload",
                        cause: e,
                    })
                );
            }
            return;
        };

        source.onerror = (event: Event) => {
            // EventSource does not provide many details...
            handlers.onError(
                new RTSKError({
                    kind: "transport",
                    message: "SSE connection error",
                    cause: event,
                })
            );
        };

        // There is no onopen here; statuses are managed by the controller above
    }

    disconnect(): void {
        if (!this.active) {
            return;
        }

        this.active = false;

        if (this.source) {
            this.source.close();
            this.source = null;
        }
    }
}
