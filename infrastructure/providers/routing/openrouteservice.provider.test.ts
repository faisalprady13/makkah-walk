import { afterEach, describe, expect, it, vi } from "vitest";
import {
  OpenRouteServiceProvider,
  toOpenRouteServiceCoordinate,
} from "./openrouteservice.provider";

const endpoint =
  "https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson";
const origin = { latitude: 21.4225, longitude: 39.8262 };
const destination = { latitude: 21.4153, longitude: 39.8294 };

function routeResponse() {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [39.8262, 21.4225, 0],
            [39.828, 21.419, 0],
            [39.8294, 21.4153, 0],
          ],
        },
        properties: {
          summary: { distance: 1_240.5, duration: 920.25 },
          segments: [
            {
              steps: [
                {
                  instruction: "Head south",
                  distance: 140,
                  duration: 100,
                  type: 0,
                  name: "Sample Street",
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("OpenRouteServiceProvider", () => {
  it("converts application coordinates to ORS longitude-latitude order", () => {
    expect(toOpenRouteServiceCoordinate(origin)).toEqual([39.8262, 21.4225]);
    expect(() =>
      toOpenRouteServiceCoordinate({ latitude: Number.NaN, longitude: 39 }),
    ).toThrow(/invalid/i);
  });

  it("requests foot-walking GeoJSON and normalizes geometry, metrics, and instructions", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json(routeResponse()),
    );
    const provider = new OpenRouteServiceProvider({
      apiKey: "test-server-key",
      fetcher,
    });

    const route = await provider.getWalkingRoute(origin, destination);
    const request = fetcher.mock.calls[0];

    expect(fetcher).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "test-server-key",
        }),
        body: JSON.stringify({
          coordinates: [
            [origin.longitude, origin.latitude],
            [destination.longitude, destination.latitude],
          ],
        }),
      }),
    );
    expect(route).toMatchObject({
      geometry: {
        type: "LineString",
        coordinates: [
          [39.8262, 21.4225],
          [39.828, 21.419],
          [39.8294, 21.4153],
        ],
      },
      distanceMeters: 1_240.5,
      durationSeconds: 920.25,
      provider: "openrouteservice",
      isDemonstration: false,
      instructions: [
        {
          instruction: "Head south",
          distanceMeters: 140,
          durationSeconds: 100,
          type: 0,
          name: "Sample Street",
        },
      ],
    });
    expect(request?.[0]).toBe(endpoint);
  });

  it("requires a configured key and never calls ORS without one", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const provider = new OpenRouteServiceProvider({ fetcher });

    await expect(provider.getWalkingRoute(origin, destination)).rejects.toMatchObject({
      code: "configuration",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [429, "rate_limited"],
    [503, "unavailable"],
  ] as const)("normalizes ORS HTTP %i errors", async (status, code) => {
    const provider = new OpenRouteServiceProvider({
      apiKey: "test-server-key",
      fetcher: vi.fn<typeof fetch>(async () => new Response(null, { status })),
    });

    await expect(provider.getWalkingRoute(origin, destination)).rejects.toMatchObject({
      code,
    });
  });

  it("retains the upstream HTTP status for otherwise unclassified failures", async () => {
    const provider = new OpenRouteServiceProvider({
      apiKey: "test-server-key",
      fetcher: vi.fn<typeof fetch>(async () => new Response(null, { status: 503 })),
    });

    await expect(
      provider.getWalkingRoute(origin, destination),
    ).rejects.toMatchObject({
      code: "unavailable",
      upstreamStatus: 503,
    });
  });

  it("rejects malformed GeoJSON and empty routes instead of drawing a fallback line", async () => {
    const malformedProvider = new OpenRouteServiceProvider({
      apiKey: "test-server-key",
      fetcher: vi.fn<typeof fetch>(async () =>
        Response.json({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: [[400, 21], [39, 21]] },
              properties: { summary: { distance: 10, duration: 10 } },
            },
          ],
        }),
      ),
    });
    const emptyProvider = new OpenRouteServiceProvider({
      apiKey: "test-server-key",
      fetcher: vi.fn<typeof fetch>(async () =>
        Response.json({ type: "FeatureCollection", features: [] }),
      ),
    });

    await expect(
      malformedProvider.getWalkingRoute(origin, destination),
    ).rejects.toMatchObject({ code: "invalid_response" });
    await expect(
      emptyProvider.getWalkingRoute(origin, destination),
    ).rejects.toMatchObject({ code: "no_route" });
  });

  it("times out an unresponsive ORS request", async () => {
    vi.useFakeTimers();
    const fetcher: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      });
    const provider = new OpenRouteServiceProvider({
      apiKey: "test-server-key",
      fetcher,
      timeoutMs: 20,
    });

    const request = provider.getWalkingRoute(origin, destination);
    const rejection = expect(request).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(20);
    await rejection;
  });
});
