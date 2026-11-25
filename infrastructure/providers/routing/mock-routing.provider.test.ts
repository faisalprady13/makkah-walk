import { describe, expect, it } from "vitest";
import { MockRoutingProvider } from "./mock-routing.provider";

describe("MockRoutingProvider", () => {
  const provider = new MockRoutingProvider();
  const origin = { latitude: 21.4225, longitude: 39.8262 };
  const destination = { latitude: 21.4153, longitude: 39.8294 };

  it("returns clearly identified demonstration route geometry and estimates", async () => {
    const route = await provider.getWalkingRoute(origin, destination);
    expect(route).toMatchObject({
      geometry: { type: "LineString" },
      provider: "mock",
      isDemonstration: true,
    });
    expect(route.geometry.coordinates).toHaveLength(3);
    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.durationMinutes).toBeGreaterThan(0);
  });

  it("rejects invalid and unsupported coordinates", async () => {
    await expect(
      provider.getWalkingRoute(
        { latitude: 100, longitude: 39 },
        destination,
      ),
    ).rejects.toThrow(/invalid/i);
    await expect(
      provider.getWalkingRoute(
        { latitude: 22, longitude: 39.8262 },
        destination,
      ),
    ).rejects.toThrow(/outside/i);
  });

  it("rejects a route between the same point", async () => {
    await expect(provider.getWalkingRoute(origin, origin)).rejects.toThrow(
      /different locations/i,
    );
  });

  it("reports when a demonstration route is unavailable", async () => {
    await expect(
      provider.getWalkingRoute(
        { latitude: 21.31, longitude: 39.71 },
        { latitude: 21.55, longitude: 39.94 },
      ),
    ).rejects.toThrow(/unavailable/i);
  });
});
