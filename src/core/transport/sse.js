import { RTSKError } from "../types/index.ts";
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
            // EventSource nu oferă multe detalii...
            handlers.onError(new RTSKError({
                kind: "transport",
                message: "SSE connection error",
                cause: event,
            }));
        };
        // Nu avem onopen aici, statusurile le va gestiona controller-ul mai sus
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
