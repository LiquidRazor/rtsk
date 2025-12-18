import { RTSKError } from "../types";
import type {
    Transport,
    TransportHandlers,
    TransportConnectOptions,
} from "../types";

/**
 * Runtime configuration for the NDJSON transport.
 *
 * @public
 */
export type NdjsonTransportConfig = {
    /** Endpoint that exposes an NDJSON stream. */
    endpoint: string;
    /** HTTP headers sent with the request when applicable. */
    headers?: Record<string, string>;
    /** Query string parameters appended to the endpoint URL. */
    query?: Record<string, string | number | boolean | null | undefined>;
    /**
     * Optional client-side timeout used to abort the request if no response is
     * received within the allotted milliseconds.
     */
    timeoutMs?: number;
};

function buildUrl(endpoint: string, query?: NdjsonTransportConfig["query"]): string {
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
 * Low-level NDJSON transport implementation.
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

export class NdjsonTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config: NdjsonTransportConfig;
    private abortController: AbortController | null = null;
    private active = false;

    constructor(config: NdjsonTransportConfig) {
        this.config = config;
    }

    connect(
        handlers: TransportHandlers<TRaw>,
        options?: TransportConnectOptions
    ): void {
        if (this.active) {
            return;
        }

        this.active = true;
        this.abortController = new AbortController();

        const signal = this.abortController.signal;
        const url = buildUrl(this.config.endpoint, this.config.query);

        const payload = options?.payload ?? null;

        const method = payload != null ? "POST" : "GET";

        const headers: Record<string, string> = {
            ...(payload != null ? { "Content-Type": "application/json" } : {}),
            ...(this.config.headers ?? {}),
        };

        const fetchOptions: RequestInit = {
            method,
            headers,
            body: payload != null ? JSON.stringify(payload) : undefined,
            signal,
        };

        let timeoutId: number | undefined;

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
                            const parsed = JSON.parse(trimmed) as TRaw;
                            handlers.onRaw(parsed);
                        } catch (e) {
                            handlers.onError(
                                new RTSKError({
                                    kind: "protocol",
                                    message: "Invalid NDJSON line",
                                    cause: e,
                                })
                            );
                        }
                    }
                }

                const last = buffer.trim();
                if (last) {
                    try {
                        const parsed = JSON.parse(last) as TRaw;
                        handlers.onRaw(parsed);
                    } catch (e) {
                        handlers.onError(
                            new RTSKError({
                                kind: "protocol",
                                message: "Invalid trailing NDJSON line",
                                cause: e,
                            })
                        );
                    }
                }

                handlers.onComplete();
            } catch (err: unknown) {
                if (err instanceof RTSKError) {
                    handlers.onError(err);
                } else if ((err as any)?.name === "AbortError") {
                    handlers.onError(
                        new RTSKError({
                            kind: "transport",
                            message: "NDJSON stream aborted",
                            cause: err,
                        })
                    );
                } else {
                    handlers.onError(
                        new RTSKError({
                            kind: "transport",
                            message: "NDJSON transport error",
                            cause: err,
                        })
                    );
                }
            } finally {
                if (timeoutId !== undefined) {
                    window.clearTimeout(timeoutId);
                }
                this.active = false;
            }
        })();
    }

    disconnect(): void {
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
