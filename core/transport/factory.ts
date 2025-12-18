import type { Transport } from "../types";
import type { StreamDefinition } from "../definitions";

import { NdjsonTransport } from "./ndjson";
import { SseTransport } from "./sse";
import { WebsocketTransport } from "./websocket";
import { RTSKError } from "../types";

export function createTransportForDefinition<TRaw>(
    definition: StreamDefinition<any, TRaw, any>
): Transport<TRaw> {
    const { endpoint, transportOptions } = definition;

    switch (definition.mode) {
        case "ndjson":
            return new NdjsonTransport<TRaw>({
                endpoint,
                headers: transportOptions?.headers,
                query: transportOptions?.query,
                timeoutMs: transportOptions?.timeoutMs,
            });

        case "sse":
            return new SseTransport<TRaw>({
                endpoint,
                query: transportOptions?.query,
                withCredentials: definition.sseOptions?.withCredentials,
                retryIntervalMs: definition.sseOptions?.retryIntervalMs,
            });

        case "websocket":
            return new WebsocketTransport<TRaw>({
                endpoint,
                query: transportOptions?.query,
                protocols: definition.wsOptions?.protocols,
                autoReconnect: definition.wsOptions?.autoReconnect,
                reconnectDelayMs: definition.wsOptions?.reconnectDelayMs,
            });

        default:
            throw new RTSKError({
                kind: "internal",
                message: `Unsupported stream mode: ${(definition as any).mode}`,
            });
    }
}
