import { RTSKError } from "../types";
import type {
    Transport,
    TransportHandlers,
} from "../types";

/**
 * Runtime configuration for the WebSocket transport.
 *
 * @public
 */
export type WebsocketTransportConfig = {
    /** Endpoint that accepts WebSocket connections. */
    endpoint: string;
    /** Query string parameters appended to the endpoint URL. */
    query?: Record<string, string | number | boolean | null | undefined>;
    /** WebSocket subprotocols to advertise during the handshake. */
    protocols?: string[];
    /** Enables automatic reconnection after unexpected closure. */
    autoReconnect?: boolean;
    /** Delay between reconnection attempts when {@link WebsocketTransportConfig.autoReconnect} is true. */
    reconnectDelayMs?: number;
};

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

/**
 * Low-level WebSocket transport implementation.
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
                    // For now, we do not do anything fancy with binary
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
                    // If disconnect was called in the meantime, do not reconnect
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
