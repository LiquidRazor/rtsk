import { RTSKError } from "../types";
import type {
    Transport,
    TransportHandlers,
} from "../types";

interface WebsocketTransportConfig {
    endpoint: string;
    query?: Record<string, string | number | boolean | null | undefined>;
    protocols?: string[];
    autoReconnect?: boolean;
    reconnectDelayMs?: number;
}

function buildUrl(endpoint: string, query?: WebsocketTransportConfig["query"]): string {
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

export class WebsocketTransport<TRaw = unknown> implements Transport<TRaw> {
    private readonly config: WebsocketTransportConfig;
    private socket: WebSocket | null = null;
    private handlers: TransportHandlers<TRaw> | null = null;
    private active = false;
    private manualClose = false;

    constructor(config: WebsocketTransportConfig) {
        this.config = config;
    }

    connect(handlers: TransportHandlers<TRaw>): void {
        if (this.active) {
            return;
        }

        this.handlers = handlers;
        this.manualClose = false;
        this.openSocket();
    }

    private openSocket(): void {
        const url = buildUrl(this.config.endpoint, this.config.query);

        const ws = this.config.protocols
            ? new WebSocket(url, this.config.protocols)
            : new WebSocket(url);

        this.socket = ws;
        this.active = true;

        ws.onmessage = (event: MessageEvent) => {
            if (!this.handlers) {
                return;
            }

            try {
                let raw: TRaw;
                if (typeof event.data === "string") {
                    raw = JSON.parse(event.data) as TRaw;
                } else {
                    // pentru început, nu facem nimic fancy cu binary
                    raw = event.data as unknown as TRaw;
                }
                this.handlers.onRaw(raw);
            } catch (e) {
                this.handlers.onError(
                    new RTSKError({
                        kind: "protocol",
                        message: "Invalid WebSocket message payload",
                        cause: e,
                    })
                );
            }
        };

        ws.onerror = (event: Event) => {
            if (!this.handlers) {
                return;
            }

            this.handlers.onError(
                new RTSKError({
                    kind: "transport",
                    message: "WebSocket error",
                    cause: event,
                })
            );
        };

        ws.onclose = () => {
            this.active = false;

            if (!this.handlers) {
                return;
            }

            this.handlers.onComplete?.();

            if (!this.manualClose && this.config.autoReconnect) {
                const delay = this.config.reconnectDelayMs ?? 1000;
                window.setTimeout(() => {
                    // dacă între timp s-a chemat disconnect, nu mai reconectăm
                    if (!this.manualClose && this.handlers) {
                        this.openSocket();
                    }
                }, delay);
            }
        };
    }

    disconnect(): void {
        this.manualClose = true;
        this.active = false;

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        }

        this.socket = null;
    }

    send(data: unknown): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new RTSKError({
                kind: "transport",
                message: "WebSocket is not open",
            });
        }

        if (typeof data === "string") {
            this.socket.send(data);
        } else {
            this.socket.send(JSON.stringify(data));
        }
    }
}
