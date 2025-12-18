import { NdjsonTransport } from "./ndjson";
import { SseTransport } from "./sse";
import { WebsocketTransport } from "./websocket";
import { RTSKError } from "../types";
/**
 * Creates a concrete transport instance that matches the provided stream definition.
 *
 * @remarks
 * This is a low-level helper used by {@link createStream} to instantiate the
 * appropriate transport for the selected protocol.
 *
 * @typeParam TRaw - Raw payload type emitted by the transport.
 * @param definition - Stream definition that determines which transport to build.
 *
 * @public
 */
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
