import type { Transport } from "../types";
import type { StreamDefinition } from "../definitions";
/**
 * Creates a concrete transport instance that matches the provided stream definition.
 *
 * @remarks
 * This is a low-level helper used by {@link createStream} to instantiate the
 * appropriate transport for the selected protocol.
 *
 * @typeParam TRaw - Raw payload type emitted by the transport.
 * @param definition - Stream definition that determines which transport to build.
 *
 * @public
 */
export declare function createTransportForDefinition<TRaw>(definition: StreamDefinition<any, TRaw, any>): Transport<TRaw>;
//# sourceMappingURL=factory.d.ts.map