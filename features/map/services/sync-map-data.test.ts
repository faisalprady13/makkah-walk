import { describe, expect, it, vi } from "vitest";
import type { Location } from "@/domain/entities/location";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import { syncMapData } from "./sync-map-data";

describe("syncMapData", () => {
  it("updates route and markers while unrelated map tiles are still loading", () => {
    const locationsSetData = vi.fn();
    const routeSetData = vi.fn();
    const isStyleLoaded = vi.fn(() => false);
    const map = {
      getSource: (id: string) => {
        if (id === "makkah-walk-locations") {
          return { type: "geojson", setData: locationsSetData };
        }
        if (id === "makkah-walk-route") {
          return { type: "geojson", setData: routeSetData };
        }
        return undefined;
      },
      isStyleLoaded,
    };
    const origin: Location = {
      id: "origin",
      name: "Origin",
      category: "landmark",
      address: "Makkah",
      coordinates: { latitude: 21.4225, longitude: 39.8262 },
      source: "sample",
    };
    const destination: Location = {
      ...origin,
      id: "destination",
      name: "Destination",
      coordinates: { latitude: 21.4153, longitude: 39.8294 },
    };
    const route: WalkingRoute = {
      geometry: {
        type: "LineString",
        coordinates: [
          [origin.coordinates.longitude + 0.0001, origin.coordinates.latitude],
          [destination.coordinates.longitude, destination.coordinates.latitude - 0.0001],
        ],
      },
      distanceMeters: 1000,
      durationSeconds: 900,
      provider: "mock",
      isDemonstration: true,
    };

    expect(syncMapData(map, origin, destination, route)).toBe(true);
    expect(isStyleLoaded).not.toHaveBeenCalled();
    expect(locationsSetData).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "FeatureCollection",
        features: [
          expect.objectContaining({
            geometry: { type: "Point", coordinates: route.geometry.coordinates[0] },
            properties: { role: "origin" },
          }),
          expect.objectContaining({
            geometry: {
              type: "Point",
              coordinates: route.geometry.coordinates[1],
            },
            properties: { role: "destination" },
          }),
        ],
      }),
    );
    expect(routeSetData).toHaveBeenCalledWith(
      expect.objectContaining({ geometry: route.geometry }),
    );
  });

  it("waits until its GeoJSON sources have been registered", () => {
    expect(syncMapData({ getSource: () => undefined }, null, null, null)).toBe(
      false,
    );
  });
});
