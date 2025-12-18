// Transforms TRequest (DTO, class, etc.) into something the transport can handle
export type RequestMapper<TRequest> = (request: TRequest) => unknown;

// Transforms the raw value read from the stream into the final object needed by the UI/domain
export type ResponseHydrator<TRaw, TResponse> = (raw: TRaw) => TResponse;
