import { RTSKError } from "../types";
function buildUrl(endpoint, query) {
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
export class SseTransport {
    config;
    source = null;
    active = false;
    constructor(config) {
        this.config = config;
    }
    connect(handlers) {
        if (this.active) {
            return;
        }
        this.active = true;
        const url = buildUrl(this.config.endpoint, this.config.query);
        const source = new EventSource(url, {
            withCredentials: Boolean(this.config.withCredentials),
        });
        this.source = source;
        source.onmessage = (ev) => {
            try {
                const raw = JSON.parse(ev.data);
                handlers.onRaw(raw);
            }
            catch (e) {
                handlers.onError(new RTSKError({
                    kind: "protocol",
                    message: "Invalid SSE message payload",
                    cause: e,
                }));
            }
            return;
        };
        source.onerror = (event) => {
            // EventSource does not provide many details...
            handlers.onError(new RTSKError({
                kind: "transport",
                message: "SSE connection error",
                cause: event,
            }));
        };
        // There is no onopen here; statuses are managed by the controller above
    }
    disconnect() {
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
