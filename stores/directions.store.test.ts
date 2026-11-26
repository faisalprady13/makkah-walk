import { beforeEach, describe, expect, it } from "vitest";
import { useDirectionsStore } from "./directions.store";

const route = {
  geometry: {
    type: "LineString" as const,
    coordinates: [
      [39.8262, 21.4225] as [number, number],
      [39.8294, 21.4153] as [number, number],
    ],
  },
  distanceMeters: 1_200,
  durationSeconds: 900,
  provider: "openrouteservice" as const,
  isDemonstration: false,
};

describe("directions store", () => {
  beforeEach(() => useDirectionsStore.getState().clearRoute());

  it("clears the previous route while a new route is loading", () => {
    useDirectionsStore.getState().setRoute(route);
    useDirectionsStore.getState().setLoading();

    expect(useDirectionsStore.getState()).toMatchObject({
      route: null,
      status: "loading",
      error: null,
    });
  });

  it("retains route metadata on success and clears route data on failure", () => {
    useDirectionsStore.getState().setRoute(route);
    expect(useDirectionsStore.getState().route).toMatchObject({
      provider: "openrouteservice",
      durationSeconds: 900,
    });

    useDirectionsStore.getState().setError("No pedestrian route is available.");
    expect(useDirectionsStore.getState()).toMatchObject({
      route: null,
      status: "error",
      error: "No pedestrian route is available.",
    });
  });
});
