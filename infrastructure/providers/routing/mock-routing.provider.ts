import { coordinatesSchema } from "@/domain/entities/coordinates";
import type { Coordinates } from "@/domain/entities/coordinates";
import type { RoutingProvider } from "@/domain/interfaces/routing-provider";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import { validateMakkahLocation } from "@/domain/services/geographic-validation";
import { RoutingProviderError } from "./routing-provider-error";

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6_371_000;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export class MockRoutingProvider implements RoutingProvider {
  async getWalkingRoute(
    origin: Coordinates,
    destination: Coordinates,
  ): Promise<WalkingRoute> {
    const validatedOrigin = coordinatesSchema.safeParse(origin);
    const validatedDestination = coordinatesSchema.safeParse(destination);

    if (!validatedOrigin.success || !validatedDestination.success) {
      throw new RoutingProviderError(
        "invalid_coordinates",
        "Route coordinates are invalid.",
      );
    }

    const originError = validateMakkahLocation(origin);
    const destinationError = validateMakkahLocation(destination);
    if (originError || destinationError) {
      throw new Error(originError ?? destinationError ?? "Locations are outside the supported area.");
    }

    const directDistance = haversineDistance(origin, destination);
    if (directDistance < 5) {
      throw new RoutingProviderError(
        "no_route",
        "Choose two different locations to see a route.",
      );
    }
    if (directDistance > 15_000) {
      throw new RoutingProviderError(
        "no_route",
        "A route is unavailable for locations this far apart.",
      );
    }

    const longitudeDelta = destination.longitude - origin.longitude;
    const latitudeDelta = destination.latitude - origin.latitude;
    const segmentLength = Math.hypot(longitudeDelta, latitudeDelta);
    const offset = Math.min(0.002, segmentLength * 0.18);
    const bendLongitude = -(latitudeDelta / segmentLength) * offset;
    const bendLatitude = (longitudeDelta / segmentLength) * offset;
    const midpoint = {
      latitude: (origin.latitude + destination.latitude) / 2,
      longitude: (origin.longitude + destination.longitude) / 2,
    };
    const routeDistance = Math.round(directDistance * 1.35);

    return {
      geometry: {
        type: "LineString",
        coordinates: [
          [origin.longitude, origin.latitude],
          [midpoint.longitude + bendLongitude, midpoint.latitude + bendLatitude],
          [destination.longitude, destination.latitude],
        ],
      },
      distanceMeters: routeDistance,
      durationSeconds: Math.max(1, Math.round(routeDistance / (4_000 / 3_600))),
      provider: "mock",
      isDemonstration: true,
    };
  }
}
