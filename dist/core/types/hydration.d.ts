/**
 * Maps a consumer-facing request into a transport-compatible payload.
 *
 * @typeParam TRequest - Request payload accepted by the stream API.
 *
 * @public
 */
export type RequestMapper<TRequest> = (request: TRequest) => unknown;
/**
 * Hydrates a raw transport payload into the consumer-facing response type.
 *
 * @typeParam TRaw - Raw payload type emitted by the transport.
 * @typeParam TResponse - Hydrated payload type delivered to subscribers.
 *
 * @public
 */
export type ResponseHydrator<TRaw, TResponse> = (raw: TRaw) => TResponse;
//# sourceMappingURL=hydration.d.ts.map