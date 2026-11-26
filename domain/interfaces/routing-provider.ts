import type { Coordinates } from "../entities/coordinates";
import type { WalkingRoute } from "../entities/walking-route";

export interface RoutingProvider {
  getWalkingRoute(
    origin: Coordinates,
    destination: Coordinates,
    signal?: AbortSignal,
  ): Promise<WalkingRoute>;
}
