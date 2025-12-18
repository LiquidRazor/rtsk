import type { StreamBaseConfig } from "./base";
/**
 * Pentru NDJSON, TRaw este de obicei object, dar lăsăm generic.
 */
export interface NdjsonStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    mode: "ndjson";
}
//# sourceMappingURL=ndjson.d.ts.map