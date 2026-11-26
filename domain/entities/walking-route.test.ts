import { describe, expect, it } from "vitest";
import { walkingRouteSchema } from "./walking-route";

const validRoute = {
  geometry: {
    type: "LineString",
    coordinates: [
      [39.8262, 21.4225],
      [39.8294, 21.4153],
    ],
  },
  distanceMeters: 1_200,
  durationSeconds: 900,
  provider: "openrouteservice",
  isDemonstration: false,
};

describe("walkingRouteSchema", () => {
  it("accepts normalized route geometry and metrics", () => {
    expect(walkingRouteSchema.safeParse(validRoute).success).toBe(true);
  });

  it("rejects malformed or too-short route geometry", () => {
    expect(
      walkingRouteSchema.safeParse({
        ...validRoute,
        geometry: { type: "LineString", coordinates: [[400, 21]] },
      }).success,
    ).toBe(false);
  });
});
