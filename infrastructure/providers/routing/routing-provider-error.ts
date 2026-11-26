export type RoutingProviderErrorCode =
  | "configuration"
  | "invalid_coordinates"
  | "no_route"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "timeout"
  | "unavailable"
  | "invalid_response";

export class RoutingProviderError extends Error {
  constructor(
    readonly code: RoutingProviderErrorCode,
    message: string,
    readonly upstreamStatus?: number,
  ) {
    super(message);
    this.name = "RoutingProviderError";
  }
}
