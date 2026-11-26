import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const origin = { latitude: 21.4225, longitude: 39.8262 };
const destination = { latitude: 21.4153, longitude: 39.8294 };

function request(body: unknown, ip = "198.51.100.40") {
  return new Request("http://localhost/api/directions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/directions", () => {
  it("uses the mock provider by default and returns a normalized route", async () => {
    vi.stubEnv("ROUTING_PROVIDER", "mock");
    const response = await POST(request({ origin, destination }));
    const route: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(route).toMatchObject({
      provider: "mock",
      isDemonstration: true,
      geometry: { type: "LineString" },
    });
  });

  it("validates request coordinates and Makkah scope", async () => {
    const invalidBody = await POST(request({ origin: { latitude: 100 }, destination }));
    const outsideArea = await POST(
      request(
        {
          origin: { latitude: 22, longitude: 39.8262 },
          destination,
        },
        "198.51.100.41",
      ),
    );

    expect(invalidBody.status).toBe(400);
    expect(await invalidBody.json()).toMatchObject({
      error: { code: "INVALID_REQUEST" },
    });
    expect(outsideArea.status).toBe(422);
    expect(await outsideArea.json()).toMatchObject({
      error: { code: "OUTSIDE_SUPPORTED_AREA" },
    });
  });

  it("returns a clear configuration error when ORS is selected without a key", async () => {
    vi.stubEnv("ROUTING_PROVIDER", "openrouteservice");
    vi.stubEnv("OPENROUTESERVICE_API_KEY", "");

    const response = await POST(request({ origin, destination }));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "ROUTING_CONFIGURATION" },
    });
  });

  it("normalizes upstream authentication failures without exposing provider details", async () => {
    vi.stubEnv("ROUTING_PROVIDER", "openrouteservice");
    vi.stubEnv("OPENROUTESERVICE_API_KEY", "test-secret-key");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () =>
        new Response("sensitive provider response", { status: 401 }),
      ),
    );

    const response = await POST(request({ origin, destination }));
    const body = await response.text();

    expect(response.status).toBe(502);
    expect(body).toContain("ROUTING_AUTHENTICATION_FAILED");
    expect(body).not.toContain("test-secret-key");
    expect(body).not.toContain("sensitive provider response");
  });

  it("includes the upstream status in a safe normalized unavailable error", async () => {
    vi.stubEnv("ROUTING_PROVIDER", "openrouteservice");
    vi.stubEnv("OPENROUTESERVICE_API_KEY", "test-secret-key");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => new Response(null, { status: 503 })),
    );

    const response = await POST(request({ origin, destination }, "198.51.100.42"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      error: {
        code: "ROUTING_UNAVAILABLE",
        message: expect.stringContaining("OpenRouteService HTTP 503"),
      },
    });
    expect(JSON.stringify(body)).not.toContain("test-secret-key");
  });
});
