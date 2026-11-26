import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Point,
} from "geojson";
import type { Location } from "@/domain/entities/location";
import type { WalkingRoute } from "@/domain/entities/walking-route";

type MapGeoJSON = Feature | FeatureCollection;

interface GeoJSONSourceLike {
  type: "geojson";
  setData: (data: MapGeoJSON) => void;
}

interface MapSourceRegistry {
  getSource: (id: string) => unknown;
}

function isGeoJSONSource(source: unknown): source is GeoJSONSourceLike {
  return (
    typeof source === "object" &&
    source !== null &&
    "type" in source &&
    source.type === "geojson" &&
    "setData" in source &&
    typeof source.setData === "function"
  );
}

function locationFeatures(
  origin: Location | null,
  destination: Location | null,
  route: WalkingRoute | null,
): FeatureCollection<Point, GeoJsonProperties> {
  const features: Feature<Point, GeoJsonProperties>[] = [];
  const routeCoordinates = route?.geometry.coordinates ?? [];
  const routeStart = routeCoordinates[0];
  const routeEnd = routeCoordinates[routeCoordinates.length - 1];
  if (origin) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates:
          routeStart ??
          [origin.coordinates.longitude, origin.coordinates.latitude],
      },
      properties: { role: "origin" },
    });
  }
  if (destination) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates:
          routeEnd ??
          [
            destination.coordinates.longitude,
            destination.coordinates.latitude,
          ],
      },
      properties: { role: "destination" },
    });
  }
  return { type: "FeatureCollection", features };
}

export function syncMapData(
  map: MapSourceRegistry,
  origin: Location | null,
  destination: Location | null,
  route: WalkingRoute | null,
): boolean {
  const locations = map.getSource("makkah-walk-locations");
  const routeSource = map.getSource("makkah-walk-route");
  if (!isGeoJSONSource(locations) || !isGeoJSONSource(routeSource)) return false;

  locations.setData(locationFeatures(origin, destination, route));
  routeSource.setData({
    type: "Feature",
    properties: {},
    geometry: route?.geometry ?? { type: "LineString", coordinates: [] },
  });
  return true;
}
