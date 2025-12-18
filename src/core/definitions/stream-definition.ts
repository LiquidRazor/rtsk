import type { NdjsonStreamDefinition } from "./ndjson";
import type { SseStreamDefinition } from "./sse";
import type { WebsocketStreamDefinition } from "./websocket";

/**
 * Union of all supported stream definition variants.
 *
 * @typeParam TRequest - Shape of the request payload accepted by the stream.
 * @typeParam TRaw - Raw payload type emitted before hydration.
 * @typeParam TResponse - Hydrated payload type delivered to consumers.
 *
 * @public
 */
export type StreamDefinition<TRequest, TRaw, TResponse> =
    | NdjsonStreamDefinition<TRequest, TRaw, TResponse>
    | SseStreamDefinition<TRequest, TRaw, TResponse>
    | WebsocketStreamDefinition<TRequest, TRaw, TResponse>;
