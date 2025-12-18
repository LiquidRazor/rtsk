# RTSK

Lightweight client-side helpers for consuming streaming APIs (NDJSON, SSE, WebSockets) with a consistent TypeScript-friendly interface.

## Features
- Stream lifecycle controller (`start`, `stop`, status inspection) built on top of browser transports.
- Unified error model (`RTSKError`) that distinguishes protocol, hydration, transport, and internal issues.
- Declarative stream definitions that keep payload mapping and hydration logic close to the transport configuration.

## Installation
```bash
npm install @liquidrazor/rtsk
```

## Usage
Create a stream definition, hydrate messages, subscribe, and start streaming:

```ts
import { createStream, type NdjsonStreamDefinition } from "@liquidrazor/rtsk";

type TodoUpdate = { id: string; status: string };

const todos: NdjsonStreamDefinition<void, TodoUpdate, TodoUpdate> = {
  mode: "ndjson",
  endpoint: "https://api.example.com/todos/stream",
  responseHydrator: (raw) => raw,
};

const stream = createStream(todos);
stream.subscribe({ onNext: console.log });
stream.start();
```

## Documentation
For complete API details, usage patterns, and publishing notes, see the [full documentation](./docs/index.md).

## Publishing
The package is configured for publishing with compiled output in `dist/`, type declarations, and included docs. Run `npm run build` before `npm publish` to ensure the `dist/` folder matches the sources.
