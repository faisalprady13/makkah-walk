import type { Coordinates } from "@/domain/entities/coordinates";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import type { RoutingProvider } from "@/domain/interfaces/routing-provider";
import { validateMakkahLocation } from "@/domain/services/geographic-validation";

export async function getWalkingRoute(
  provider: RoutingProvider,
  origin: Coordinates,
  destination: Coordinates,
): Promise<WalkingRoute> {
  const originError = validateMakkahLocation(origin);
  if (originError) throw new Error(originError);

  const destinationError = validateMakkahLocation(destination);
  if (destinationError) throw new Error(destinationError);

  return provider.getWalkingRoute(origin, destination);
}
