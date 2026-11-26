import type { Coordinates } from "@/domain/entities/coordinates";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import type { RoutingProvider } from "@/domain/interfaces/routing-provider";
import { coordinatesSchema } from "@/domain/entities/coordinates";
import { validateMakkahLocation } from "@/domain/services/geographic-validation";

export class UnsupportedRouteLocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedRouteLocationError";
  }
}

export async function getWalkingRoute(
  provider: RoutingProvider,
  origin: Coordinates,
  destination: Coordinates,
  signal?: AbortSignal,
): Promise<WalkingRoute> {
  if (!coordinatesSchema.safeParse(origin).success ||
      !coordinatesSchema.safeParse(destination).success) {
    throw new Error("Route coordinates are invalid.");
  }

  const originError = validateMakkahLocation(origin);
  if (originError) throw new UnsupportedRouteLocationError(originError);

  const destinationError = validateMakkahLocation(destination);
  if (destinationError) throw new UnsupportedRouteLocationError(destinationError);

  return provider.getWalkingRoute(origin, destination, signal);
}
