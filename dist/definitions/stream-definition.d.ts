import type { NdjsonStreamDefinition } from "./ndjson";
import type { SseStreamDefinition } from "./sse";
import type { WebsocketStreamDefinition } from "./websocket";
export type StreamDefinition<TRequest, TRaw, TResponse> = NdjsonStreamDefinition<TRequest, TRaw, TResponse> | SseStreamDefinition<TRequest, TRaw, TResponse> | WebsocketStreamDefinition<TRequest, TRaw, TResponse>;
//# sourceMappingURL=stream-definition.d.ts.map