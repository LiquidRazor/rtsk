# RTSK Documentation

## Overview
RTSK is a small toolkit for creating and managing client-side streaming connections that return incremental updates. It wraps browser-friendly transports (NDJSON over `fetch`, Server-Sent Events, and WebSockets) behind a common `createStream` controller so that UI code can subscribe to messages, errors, completion events, and status transitions without worrying about the underlying protocol.

The library focuses on three concepts:

- **Stream definitions** that describe the transport (`mode`) and how to map requests and hydrate responses.
- **Transports** that connect to remote endpoints and deliver raw payloads.
- **Stream controllers** that orchestrate lifecycle (start/stop), fan out events, and expose status.

## Installation
```bash
npm install @liquidrazor/rtsk
```

The package is shipped as an ES module with generated type declarations. The compiled output lives in `dist/` and the TypeScript sources are available in `src/` for reference.

## Quick start
Below is a minimal NDJSON example that streams chat messages:

```ts
import { createStream, RTSKError, type NdjsonStreamDefinition } from "@liquidrazor/rtsk";

type ChatMessage = { id: string; user: string; text: string };

type ChatRequest = { room: string };

const chatDefinition: NdjsonStreamDefinition<ChatRequest, unknown, ChatMessage> = {
  mode: "ndjson",
  endpoint: "https://api.example.com/stream/chat",
  transportOptions: {
    headers: { Authorization: "Bearer token" },
    query: { locale: "en" },
    timeoutMs: 25_000,
  },
  requestMapper: (req) => req,
  responseHydrator: (raw) => {
    // Enforce shape and handle server-side differences in field names
    const payload = raw as Record<string, unknown>;
    if (typeof payload.id !== "string" || typeof payload.user !== "string" || typeof payload.message !== "string") {
      throw new RTSKError({ kind: "hydrate", message: "Invalid chat payload" });
    }
    return { id: payload.id, user: payload.user, text: payload.message };
  },
};

const chatStream = createStream(chatDefinition);

chatStream.subscribe({
  onNext: (message) => console.log("message", message),
  onStatusChange: (status) => console.log("status", status),
  onError: (err) => console.error("stream error", err),
  onComplete: () => console.log("chat ended"),
});

// Start the stream with a request payload (becomes POST body for NDJSON)
chatStream.start({ room: "general" });

// Later, stop the stream
chatStream.stop();
```

## Core building blocks

### Stream definitions
A stream definition combines a transport mode and lifecycle hooks:

- `mode`: one of `"ndjson"`, `"sse"`, or `"websocket"`.【F:src/core/definitions/stream-definition.ts†L1-L8】
- `endpoint`: fully qualified URL or path relative to `window.location.origin`.【F:src/core/definitions/base.ts†L10-L19】
- `transportOptions.headers`: additional HTTP headers for NDJSON requests.【F:src/core/definitions/base.ts†L13-L17】
- `transportOptions.query`: query parameters appended to the URL across transports.【F:src/core/definitions/base.ts†L13-L17】
- `transportOptions.timeoutMs`: abort threshold (ms) for NDJSON requests.【F:src/core/definitions/base.ts†L13-L17】【F:src/core/transport/ndjson.ts†L53-L80】
- `requestMapper(request)`: maps your request DTO to a transport-friendly payload (e.g., JSON body).【F:src/core/definitions/base.ts†L19-L21】
- `responseHydrator(raw)`: converts raw messages into typed responses. Throwing here marks the stream as `error`.【F:src/core/definitions/base.ts†L23-L24】【F:src/core/stream/createStream.ts†L26-L53】
- `meta`: arbitrary metadata useful for logging or analytics.【F:src/core/definitions/base.ts†L26-L26】

Each transport also offers optional extras:

- **NDJSON**: no extra options; suited for streaming JSON lines over HTTP.【F:src/core/definitions/ndjson.ts†L1-L8】
- **SSE**: `sseOptions` with `withCredentials` and `retryIntervalMs` hints.【F:src/core/definitions/sse.ts†L1-L12】
- **WebSocket**: `wsOptions` with `protocols`, `autoReconnect`, and `reconnectDelayMs`.【F:src/core/definitions/websocket.ts†L1-L12】

### Stream controller
`createStream` accepts a `StreamDefinition` and returns a controller with lifecycle helpers and subscription support.【F:src/core/stream/createStream.ts†L7-L86】

Controller API:

- `start(request?)`: opens the stream, mapping the optional request with `requestMapper` when provided. Repeated calls while active are ignored.【F:src/core/stream/createStream.ts†L28-L73】
- `stop()`: disconnects the transport and transitions status to `"stopped"`. Safe to call when inactive.【F:src/core/stream/createStream.ts†L75-L111】
- `getStatus()`: returns current status (`"idle" | "connecting" | "streaming" | "completed" | "error" | "stopped"`).【F:src/core/stream/createStream.ts†L113-L122】【F:src/core/types/status.ts†L1-L7】
- `isActive()`: indicates whether a transport is currently open.【F:src/core/stream/createStream.ts†L113-L120】
- `subscribe(handlers)`: registers callbacks and returns `unsubscribe()`. Multiple subscribers are supported.【F:src/core/stream/createStream.ts†L12-L24】【F:src/core/types/stream.ts†L4-L21】

### Event handlers
Handlers are optional—provide only the ones you need.【F:src/core/types/stream.ts†L4-L21】

- `onNext(value)`: hydrated responses emitted by the stream.
- `onError(error)`: receives `RTSKError` instances (see below) and automatically sets status to `"error"`.【F:src/core/stream/createStream.ts†L36-L70】
- `onComplete()`: called when the transport finishes without errors (e.g., HTTP stream ended, WebSocket closed).【F:src/core/stream/createStream.ts†L54-L70】【F:src/core/stream/createStream.ts†L88-L104】
- `onStatusChange(status)`: notified on every status transition (including `stopped`).【F:src/core/stream/createStream.ts†L14-L23】【F:src/core/stream/createStream.ts†L95-L111】

### Error model
RTSK wraps errors in `RTSKError` so you can react based on `kind`:

- `"transport"`: network/transport issues (connection failure, aborted requests, WebSocket errors).【F:src/core/types/error.ts†L3-L22】【F:src/core/transport/ndjson.ts†L62-L158】【F:src/core/transport/sse.ts†L36-L60】【F:src/core/transport/websocket.ts†L40-L79】
- `"hydrate"`: response hydration failed in your `responseHydrator`.【F:src/core/types/error.ts†L3-L22】【F:src/core/stream/createStream.ts†L32-L53】
- `"protocol"`: malformed payloads (bad JSON lines/messages).【F:src/core/types/error.ts†L3-L22】【F:src/core/transport/ndjson.ts†L100-L143】【F:src/core/transport/sse.ts†L36-L55】【F:src/core/transport/websocket.ts†L55-L79】
- `"internal"`: unexpected conditions such as unsupported modes or controller failures.【F:src/core/types/error.ts†L3-L22】【F:src/core/stream/createStream.ts†L56-L73】【F:src/core/transport/factory.ts†L1-L35】

The error instance also carries the previous status (`statusBefore`) when available.【F:src/core/types/error.ts†L3-L22】

### Transport details
RTSK ships transport implementations that align with browser APIs:

- **NDJSONTransport**: uses `fetch` with optional POST body when a request payload is supplied. Streams lines via `ReadableStreamDefaultReader`, decodes UTF-8 text, and parses each JSON line. Supports optional abort via `timeoutMs`.【F:src/core/transport/ndjson.ts†L12-L158】
- **SseTransport**: wraps `EventSource`, parsing each `data` payload as JSON. Credentials support mirrors `EventSource` options.。【F:src/core/transport/sse.ts†L10-L64】
- **WebsocketTransport**: opens a `WebSocket`, parses text frames as JSON, passes binary through untouched, and optionally reconnects automatically. Includes a `send` helper for open sockets.。【F:src/core/transport/websocket.ts†L10-L95】

These transports are created internally by `createTransportForDefinition`; you usually do not instantiate them directly.【F:src/core/transport/factory.ts†L1-L35】

## Additional usage examples

### Server-Sent Events
```ts
import { createStream, type SseStreamDefinition } from "@liquidrazor/rtsk";

type PriceUpdate = { symbol: string; price: number };

const priceStream: SseStreamDefinition<void, PriceUpdate, PriceUpdate> = {
  mode: "sse",
  endpoint: "/prices", // resolved relative to current origin
  responseHydrator: (raw) => {
    if (typeof raw.symbol !== "string" || typeof raw.price !== "number") {
      throw new Error("Invalid price payload");
    }
    return raw;
  },
};

const controller = createStream(priceStream);
controller.subscribe({ onNext: console.log });
controller.start();
```

### WebSocket with auto-reconnect
```ts
import { createStream, type WebsocketStreamDefinition } from "@liquidrazor/rtsk";

type EventEnvelope = { type: string; payload: unknown };

const events: WebsocketStreamDefinition<void, EventEnvelope, EventEnvelope> = {
  mode: "websocket",
  endpoint: "wss://ws.example.com/events",
  wsOptions: {
    protocols: ["json"],
    autoReconnect: true,
    reconnectDelayMs: 1500,
  },
  responseHydrator: (raw) => raw,
};

const wsStream = createStream(events);
wsStream.subscribe({
  onNext: (evt) => console.log("event", evt.type),
  onError: (err) => console.error(err.kind, err.message),
});
wsStream.start();
```

### Hydration failure handling
When `responseHydrator` throws, the controller pushes an `RTSKError` with `kind: "hydrate"`, stops the stream, and sets status to `"error"`. Use this to keep your UI resilient to schema changes:

```ts
controller.subscribe({
  onError: (err) => {
    if (err.kind === "hydrate") {
      showToast("We could not parse the latest update; please refresh");
    }
  },
});
```

## Publishing checklist
- Build output in `dist/` and type declarations in `dist/index.d.ts` are bundled by default via the `files` field in `package.json`.
- This repository now ships documentation in `docs/` and a top-level `README.md` for npm consumers.
- Ensure your CI runs `npm run build` before publishing to keep `dist/` in sync with sources.
- Use `npm publish --access public` (for scoped packages) once you are satisfied with the contents.
