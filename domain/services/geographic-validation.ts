import type { Coordinates } from "../entities/coordinates";
import type { GeographicBoundary } from "../config/geographic-boundary";
import { MAKKAH_BOUNDARY } from "../config/geographic-boundary";

export function isInsideBoundary(
  point: Coordinates,
  boundary: GeographicBoundary = MAKKAH_BOUNDARY,
): boolean {
  const polygon = boundary.polygon;
  let isInside = false;

  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const currentPoint = polygon[current];
    const previousPoint = polygon[previous];
    if (!currentPoint || !previousPoint) continue;

    const intersects =
      currentPoint.latitude > point.latitude !==
        previousPoint.latitude > point.latitude &&
      point.longitude <
        ((previousPoint.longitude - currentPoint.longitude) *
          (point.latitude - currentPoint.latitude)) /
          (previousPoint.latitude - currentPoint.latitude) +
          currentPoint.longitude;

    if (intersects) isInside = !isInside;
  }

  return isInside;
}

export function validateMakkahLocation(point: Coordinates): string | null {
  return isInsideBoundary(point)
    ? null
    : "This location is outside the approximate Makkah area supported by this demo.";
}
