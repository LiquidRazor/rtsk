# RTSK

RTSK is a small, focused client-side toolkit for working with streaming APIs in the browser.
It provides a unified, type-safe abstraction over common streaming transports such as **NDJSON over HTTP**,
**Server-Sent Events (SSE)**, and **WebSockets**.

RTSK is designed to let application code focus on **what to do with streamed data**,
not **how each transport behaves**.

---

## Why RTSK?

Modern front-end applications increasingly rely on streaming APIs for:
- live updates
- progress reporting
- real-time dashboards
- long-running server-side computations

Each transport has different semantics, APIs, and edge cases.
RTSK hides those differences behind a single, predictable controller-based API.

---

## Core concepts

RTSK is built around three core ideas.

### Stream definitions

A **stream definition** describes *how* to connect to a stream:
- which transport to use (`ndjson`, `sse`, or `websocket`)
- the endpoint to connect to
- how to map an optional request payload
- how to hydrate raw transport data into typed responses

Stream definitions are declarative and transport-agnostic.

---

### Stream controllers

The `createStream` function creates a **stream controller**.

A stream controller:
- manages the stream lifecycle (`start`, `stop`)
- tracks the current stream status
- distributes data, errors, and completion events to subscribers

Controllers support multiple subscribers and expose a simple callback-based API.

---

### Transports

RTSK ships with built-in transport implementations for:
- NDJSON over `fetch`
- Server-Sent Events (`EventSource`)
- WebSockets

Most users never need to interact with transports directly.
They are exposed for advanced use cases such as testing, custom wiring,
or fine-grained lifecycle control.

---

## Installation

```bash
npm install @liquidrazor/rtsk
```

RTSK is shipped as an ES module with full TypeScript type declarations.
Compiled output lives in `dist/`, while source code is available in `src/`.

---

## Typical usage

The most common workflow looks like this:

1. Define a stream using a stream definition
2. Create a controller with `createStream`
3. Subscribe to stream events
4. Start the stream
5. Stop it when no longer needed

```ts
import { createStream } from "@liquidrazor/rtsk";

const controller = createStream({
  mode: "ndjson",
  endpoint: "/api/stream",
  responseHydrator: (raw) => raw,
});

const sub = controller.subscribe({
  onNext: (value) => console.log(value),
  onError: (err) => console.error(err),
});

controller.start();

// later
controller.stop();
sub.unsubscribe();
```

---

## Error handling

RTSK reports all errors using the `RTSKError` type.
Errors are categorized by kind, such as:
- `transport` – network or connection failures
- `hydrate` – response hydration failures
- `protocol` – malformed payloads
- `internal` – unexpected internal errors

This allows applications to react differently based on error category.

---

## Advanced usage

RTSK exposes low-level transport implementations for advanced scenarios:
- testing transport behavior in isolation
- building custom stream orchestration
- direct access to transport lifecycle hooks

Most applications should rely on `createStream` unless they have a specific need
for lower-level control.

---

## API reference

- `createStream`
- `StreamController`
- `StreamDefinition`
- `RTSKError`

For full API details, see the generated reference documentation in [API docs](/docs/api/).

---

## Project status

RTSK is currently in early development (`0.x`).
The public API is documented and versioned, but some advanced configuration
options may evolve as the library matures.
