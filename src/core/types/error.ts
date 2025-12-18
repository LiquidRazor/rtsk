import type { RTSKStatus } from "./status";

export type RTSKErrorKind =
  | "transport"
  | "hydrate"
  | "protocol"
  | "internal";

export interface RTSKErrorDetails {
  kind: RTSKErrorKind;
  message: string;
  cause?: unknown;
  statusBefore?: RTSKStatus;
}

export class RTSKError extends Error {
  public readonly kind: RTSKErrorKind;
  public readonly cause?: unknown;
  public readonly statusBefore?: RTSKStatus;

  constructor(details: RTSKErrorDetails) {
    super(details.message);
    this.name = "RTSKError";
    this.kind = details.kind;
    this.cause = details.cause;
    this.statusBefore = details.statusBefore;
  }
}
