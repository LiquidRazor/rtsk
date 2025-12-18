import type { StreamBaseConfig } from "./base";

/**
 * For NDJSON, TRaw is usually an object, but we keep it generic.
 */
export interface NdjsonStreamDefinition<TRequest, TRaw, TResponse>
    extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: "ndjson";
}
