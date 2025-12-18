import type { StreamBaseConfig } from "./base";
/**
 * Definition for a newline-delimited JSON (NDJSON) stream.
 *
 * @remarks
 * The transport emits individual lines, each expected to be a valid JSON
 * document. Hydration is performed via {@link StreamBaseConfig.responseHydrator}.
 *
 * @typeParam TRequest - Shape of the request payload accepted by the stream.
 * @typeParam TRaw - Raw NDJSON object type before hydration.
 * @typeParam TResponse - Hydrated payload type delivered to consumers.
 *
 * @public
 */
export interface NdjsonStreamDefinition<TRequest, TRaw, TResponse> extends StreamBaseConfig<TRequest, TRaw, TResponse> {
    /** Identifies the stream as NDJSON-based. */
    mode: "ndjson";
}
//# sourceMappingURL=ndjson.d.ts.map