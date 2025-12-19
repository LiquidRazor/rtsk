// src/core/types/error.ts
var RTSKError = class extends Error {
  /** Classification of the error. */
  kind;
  /** Optional underlying error or diagnostic payload. */
  cause;
  /** Controller status immediately prior to the error (when known). */
  statusBefore;
  constructor(details) {
    super(details.message);
    this.name = "RTSKError";
    this.kind = details.kind;
    this.cause = details.cause;
    this.statusBefore = details.statusBefore;
  }
};

// src/core/transport/ndjson.ts
function buildUrl(endpoint, query) {
  if (!query || Object.keys(query).length === 0) {
    return endpoint;
  }
  const url = new URL(endpoint, window.location.origin);
  Object.entries(query).forEach(([key, value]) => {
    if (value === void 0 || value === null) {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}
var NdjsonTransport = class {
  config;
  abortController = null;
  active = false;
  constructor(config) {
    this.config = config;
  }
  connect(handlers, options) {
    if (this.active) {
      return;
    }
    this.active = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const url = buildUrl(this.config.endpoint, this.config.query);
    const payload = options?.payload ?? null;
    const method = payload != null ? "POST" : "GET";
    const headers = {
      ...payload != null ? { "Content-Type": "application/json" } : {},
      ...this.config.headers ?? {}
    };
    const fetchOptions = {
      method,
      headers,
      body: payload != null ? JSON.stringify(payload) : void 0,
      signal
    };
    let timeoutId;
    if (this.config.timeoutMs && this.config.timeoutMs > 0) {
      timeoutId = window.setTimeout(() => {
        if (this.abortController) {
          this.abortController.abort();
        }
      }, this.config.timeoutMs);
    }
    void (async () => {
      try {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
          throw new RTSKError({
            kind: "transport",
            message: `NDJSON fetch failed with status ${response.status}`,
            statusBefore: "connecting"
          });
        }
        if (!response.body) {
          throw new RTSKError({
            kind: "transport",
            message: "NDJSON response has no body",
            statusBefore: "connecting"
          });
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (; ; ) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          if (!value) {
            continue;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              continue;
            }
            try {
              const parsed = JSON.parse(trimmed);
              handlers.onRaw(parsed);
            } catch (e) {
              handlers.onError(
                new RTSKError({
                  kind: "protocol",
                  message: "Invalid NDJSON line",
                  cause: e
                })
              );
            }
          }
        }
        const last = buffer.trim();
        if (last) {
          try {
            const parsed = JSON.parse(last);
            handlers.onRaw(parsed);
          } catch (e) {
            handlers.onError(
              new RTSKError({
                kind: "protocol",
                message: "Invalid trailing NDJSON line",
                cause: e
              })
            );
          }
        }
        handlers.onComplete();
      } catch (err) {
        if (err instanceof RTSKError) {
          handlers.onError(err);
        } else if (err?.name === "AbortError") {
          handlers.onError(
            new RTSKError({
              kind: "transport",
              message: "NDJSON stream aborted",
              cause: err
            })
          );
        } else {
          handlers.onError(
            new RTSKError({
              kind: "transport",
              message: "NDJSON transport error",
              cause: err
            })
          );
        }
      } finally {
        if (timeoutId !== void 0) {
          window.clearTimeout(timeoutId);
        }
        this.active = false;
      }
    })();
  }
  disconnect() {
    if (!this.active) {
      return;
    }
    this.active = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
};

// src/core/transport/sse.ts
function buildUrl2(endpoint, query) {
  if (!query || Object.keys(query).length === 0) {
    return endpoint;
  }
  const url = new URL(endpoint, window.location.origin);
  Object.entries(query).forEach(([key, value]) => {
    if (value === void 0 || value === null) {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}
var SseTransport = class {
  config;
  source = null;
  active = false;
  constructor(config) {
    this.config = config;
  }
  connect(handlers) {
    if (this.active) {
      return;
    }
    this.active = true;
    const url = buildUrl2(this.config.endpoint, this.config.query);
    const source = new EventSource(url, {
      withCredentials: Boolean(this.config.withCredentials)
    });
    this.source = source;
    source.onmessage = (ev) => {
      try {
        const raw = JSON.parse(ev.data);
        handlers.onRaw(raw);
      } catch (e) {
        handlers.onError(
          new RTSKError({
            kind: "protocol",
            message: "Invalid SSE message payload",
            cause: e
          })
        );
      }
      return;
    };
    source.onerror = (event) => {
      handlers.onError(
        new RTSKError({
          kind: "transport",
          message: "SSE connection error",
          cause: event
        })
      );
    };
  }
  disconnect() {
    if (!this.active) {
      return;
    }
    this.active = false;
    if (this.source) {
      this.source.close();
      this.source = null;
    }
  }
};

// src/core/transport/websocket.ts
function buildUrl3(endpoint, query) {
  if (!query || Object.keys(query).length === 0) {
    return endpoint;
  }
  const url = new URL(endpoint, window.location.origin);
  Object.entries(query).forEach(([key, value]) => {
    if (value === void 0 || value === null) {
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}
var WebsocketTransport = class {
  config;
  socket = null;
  handlers = null;
  active = false;
  manualClose = false;
  constructor(config) {
    this.config = config;
  }
  connect(handlers) {
    if (this.active) {
      return;
    }
    this.handlers = handlers;
    this.manualClose = false;
    this.openSocket();
  }
  openSocket() {
    const url = buildUrl3(this.config.endpoint, this.config.query);
    const ws = this.config.protocols ? new WebSocket(url, this.config.protocols) : new WebSocket(url);
    this.socket = ws;
    this.active = true;
    ws.onmessage = (event) => {
      if (!this.handlers) {
        return;
      }
      try {
        let raw;
        if (typeof event.data === "string") {
          raw = JSON.parse(event.data);
        } else {
          raw = event.data;
        }
        this.handlers.onRaw(raw);
      } catch (e) {
        this.handlers.onError(
          new RTSKError({
            kind: "protocol",
            message: "Invalid WebSocket message payload",
            cause: e
          })
        );
      }
    };
    ws.onerror = (event) => {
      if (!this.handlers) {
        return;
      }
      this.handlers.onError(
        new RTSKError({
          kind: "transport",
          message: "WebSocket error",
          cause: event
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
        const delay = this.config.reconnectDelayMs ?? 1e3;
        window.setTimeout(() => {
          if (!this.manualClose && this.handlers) {
            this.openSocket();
          }
        }, delay);
      }
    };
  }
  disconnect() {
    this.manualClose = true;
    this.active = false;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
    this.socket = null;
  }
  send(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new RTSKError({
        kind: "transport",
        message: "WebSocket is not open"
      });
    }
    if (typeof data === "string") {
      this.socket.send(data);
    } else {
      this.socket.send(JSON.stringify(data));
    }
  }
};

// src/core/transport/factory.ts
function createTransportForDefinition(definition) {
  const { endpoint, transportOptions } = definition;
  switch (definition.mode) {
    case "ndjson":
      return new NdjsonTransport({
        endpoint,
        headers: transportOptions?.headers,
        query: transportOptions?.query,
        timeoutMs: transportOptions?.timeoutMs
      });
    case "sse":
      return new SseTransport({
        endpoint,
        query: transportOptions?.query,
        withCredentials: definition.sseOptions?.withCredentials,
        retryIntervalMs: definition.sseOptions?.retryIntervalMs
      });
    case "websocket":
      return new WebsocketTransport({
        endpoint,
        query: transportOptions?.query,
        protocols: definition.wsOptions?.protocols,
        autoReconnect: definition.wsOptions?.autoReconnect,
        reconnectDelayMs: definition.wsOptions?.reconnectDelayMs
      });
    default:
      throw new RTSKError({
        kind: "internal",
        message: `Unsupported stream mode: ${definition.mode}`
      });
  }
}

// src/core/stream/createStream.ts
function createStream(definition) {
  let status = "idle";
  let active = false;
  const subscribers = /* @__PURE__ */ new Set();
  let transport = null;
  function notifyStatus(newStatus) {
    if (status === newStatus) return;
    status = newStatus;
    for (const sub of subscribers) {
      sub.onStatusChange?.(status);
    }
  }
  function notifyNext(value) {
    for (const sub of subscribers) {
      sub.onNext?.(value);
    }
  }
  function disconnectTransportSafely(reason) {
    if (!transport) return;
    try {
      transport.disconnect();
    } catch (e) {
      if (reason === "stop") {
        const err = new RTSKError({
          kind: "internal",
          message: "Error while disconnecting transport",
          cause: e,
          statusBefore: status
        });
        for (const sub of subscribers) {
          sub.onError?.(err);
        }
      }
    } finally {
      transport = null;
    }
  }
  function notifyError(error) {
    disconnectTransportSafely("error");
    notifyStatus("error");
    active = false;
    for (const sub of subscribers) {
      sub.onError?.(error);
    }
  }
  function notifyComplete() {
    disconnectTransportSafely("complete");
    notifyStatus("completed");
    active = false;
    for (const sub of subscribers) {
      sub.onComplete?.();
    }
  }
  function start(request) {
    if (active) {
      return;
    }
    active = true;
    notifyStatus("connecting");
    transport = createTransportForDefinition(definition);
    const payload = definition.requestMapper && request !== void 0 ? definition.requestMapper(request) : request;
    try {
      transport.connect(
        {
          onRaw(raw) {
            try {
              const hydrated = definition.responseHydrator(raw);
              if (status === "connecting") {
                notifyStatus("streaming");
              }
              notifyNext(hydrated);
            } catch (e) {
              notifyError(
                new RTSKError({
                  kind: "hydrate",
                  message: "Failed to hydrate stream payload",
                  cause: e,
                  statusBefore: status
                })
              );
            }
          },
          onError(err) {
            notifyError(err);
          },
          onComplete() {
            notifyComplete();
          }
        },
        {
          payload,
          // Not exposing external AbortSignal for now; transports manage abort internally.
          signal: null
        }
      );
      if (status === "connecting") {
        notifyStatus("streaming");
      }
    } catch (e) {
      notifyError(
        e instanceof RTSKError ? e : new RTSKError({
          kind: "internal",
          message: "Failed to start stream",
          cause: e,
          statusBefore: status
        })
      );
    }
  }
  function stop() {
    if (!active && status !== "connecting" && status !== "streaming") {
      return;
    }
    active = false;
    disconnectTransportSafely("stop");
    notifyStatus("stopped");
  }
  function subscribe(handlers) {
    subscribers.add(handlers);
    return {
      unsubscribe() {
        subscribers.delete(handlers);
      }
    };
  }
  return {
    start,
    stop,
    getStatus() {
      return status;
    },
    isActive() {
      return active;
    },
    subscribe
  };
}

export { NdjsonTransport, RTSKError, SseTransport, WebsocketTransport, createStream };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map