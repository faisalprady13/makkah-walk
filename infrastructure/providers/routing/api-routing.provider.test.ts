import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRoutingProvider } from "./api-routing.provider";

const origin = { latitude: 21.4225, longitude: 39.8262 };
const destination = { latitude: 21.4153, longitude: 39.8294 };
const route = {
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

afterEach(() => vi.unstubAllGlobals());

describe("ApiRoutingProvider", () => {
  it("uses the same-origin directions endpoint and validates its normalized response", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json(route));
    vi.stubGlobal("fetch", fetcher);

    await expect(
      new ApiRoutingProvider().getWalkingRoute(origin, destination),
    ).resolves.toEqual(route);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/directions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ origin, destination }),
      }),
    );
  });

  it("surfaces only normalized API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        Response.json(
          { error: { code: "NO_ROUTE", message: "No pedestrian route is available." } },
          { status: 422 },
        ),
      ),
    );

    await expect(
      new ApiRoutingProvider().getWalkingRoute(origin, destination),
    ).rejects.toThrow("No pedestrian route is available.");
  });
});
