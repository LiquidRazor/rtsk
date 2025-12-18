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
export class NdjsonTransport {
    config;
    abortController = null;
    active = false;
    constructor(config) {
        this.config = config;
    }
    connect(handlers, options) {
        if (this.active) {
            return;
        }
        this.active = true;
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        const url = buildUrl(this.config.endpoint, this.config.query);
        const payload = options?.payload ?? null;
        const method = payload != null ? "POST" : "GET";
        const headers = {
            ...(payload != null ? { "Content-Type": "application/json" } : {}),
            ...(this.config.headers ?? {}),
        };
        const fetchOptions = {
            method,
            headers,
            body: payload != null ? JSON.stringify(payload) : undefined,
            signal,
        };
        let timeoutId;
        if (this.config.timeoutMs && this.config.timeoutMs > 0) {
            timeoutId = window.setTimeout(() => {
                if (this.abortController) {
                    this.abortController.abort();
                }
            }, this.config.timeoutMs);
        }
        void (async () => {
            try {
                const response = await fetch(url, fetchOptions);
                if (!response.ok) {
                    throw new RTSKError({
                        kind: "transport",
                        message: `NDJSON fetch failed with status ${response.status}`,
                        statusBefore: "connecting",
                    });
                }
                if (!response.body) {
                    throw new RTSKError({
                        kind: "transport",
                        message: "NDJSON response has no body",
                        statusBefore: "connecting",
                    });
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                for (;;) {
                    const { value, done } = await reader.read();
                    if (done) {
                        break;
                    }
                    if (!value) {
                        continue;
                    }
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split(/\r?\n/);
                    buffer = lines.pop() ?? "";
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) {
                            continue;
                        }
                        try {
                            const parsed = JSON.parse(trimmed);
                            handlers.onRaw(parsed);
                        }
                        catch (e) {
                            handlers.onError(new RTSKError({
                                kind: "protocol",
                                message: "Invalid NDJSON line",
                                cause: e,
                            }));
                        }
                    }
                }
                const last = buffer.trim();
                if (last) {
                    try {
                        const parsed = JSON.parse(last);
                        handlers.onRaw(parsed);
                    }
                    catch (e) {
                        handlers.onError(new RTSKError({
                            kind: "protocol",
                            message: "Invalid trailing NDJSON line",
                            cause: e,
                        }));
                    }
                }
                handlers.onComplete();
            }
            catch (err) {
                if (err instanceof RTSKError) {
                    handlers.onError(err);
                }
                else if (err?.name === "AbortError") {
                    handlers.onError(new RTSKError({
                        kind: "transport",
                        message: "NDJSON stream aborted",
                        cause: err,
                    }));
                }
                else {
                    handlers.onError(new RTSKError({
                        kind: "transport",
                        message: "NDJSON transport error",
                        cause: err,
                    }));
                }
            }
            finally {
                if (timeoutId !== undefined) {
                    window.clearTimeout(timeoutId);
                }
                this.active = false;
            }
        })();
    }
    disconnect() {
        if (!this.active) {
            return;
        }
        this.active = false;
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}
