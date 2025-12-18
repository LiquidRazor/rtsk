import { NdjsonTransport } from "./ndjson";
import { SseTransport } from "./sse";
import { WebsocketTransport } from "./websocket";
import { RTSKError } from "../types";
export function createTransportForDefinition(definition) {
    const { endpoint, transportOptions } = definition;
    switch (definition.mode) {
        case "ndjson":
            return new NdjsonTransport({
                endpoint,
                headers: transportOptions?.headers,
                query: transportOptions?.query,
                timeoutMs: transportOptions?.timeoutMs,
            });
        case "sse":
            return new SseTransport({
                endpoint,
                query: transportOptions?.query,
                withCredentials: definition.sseOptions?.withCredentials,
                retryIntervalMs: definition.sseOptions?.retryIntervalMs,
            });
        case "websocket":
            return new WebsocketTransport({
                endpoint,
                query: transportOptions?.query,
                protocols: definition.wsOptions?.protocols,
                autoReconnect: definition.wsOptions?.autoReconnect,
                reconnectDelayMs: definition.wsOptions?.reconnectDelayMs,
            });
        default:
            throw new RTSKError({
                kind: "internal",
                message: `Unsupported stream mode: ${definition.mode}`,
            });
    }
}
