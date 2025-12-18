// Transformă TRequest (DTO, clasă, etc) în ceva ce poate mânca transport-ul
export type RequestMapper<TRequest> = (request: TRequest) => unknown;

// Transformă valoarea brută citită din stream în obiectul final de care are nevoie UI / domeniul
export type ResponseHydrator<TRaw, TResponse> = (raw: TRaw) => TResponse;
