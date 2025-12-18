import type { RTSKStatus } from "./status";
import type { RTSKError } from "./error";
export interface StreamEventHandlers<TResponse> {
    onNext?(value: TResponse): void;
    onError?(error: RTSKError): void;
    onComplete?(): void;
    onStatusChange?(status: RTSKStatus): void;
}
export interface StreamSubscription {
    unsubscribe(): void;
}
export interface StreamController<TRequest = unknown, TResponse = unknown> {
    start(request?: TRequest): void;
    stop(): void;
    getStatus(): RTSKStatus;
    isActive(): boolean;
    subscribe(handlers: StreamEventHandlers<TResponse>): StreamSubscription;
}
//# sourceMappingURL=stream.d.ts.map