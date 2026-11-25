import { describe, expect, it } from "vitest";
import { MockGeocodingProvider } from "./mock-geocoding.provider";

describe("MockGeocodingProvider", () => {
  const provider = new MockGeocodingProvider();

  it("returns matching sample locations with coordinates", async () => {
    const results = await provider.searchLocations("masjid");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: "Masjid al-Haram",
      source: "sample",
      coordinates: { latitude: 21.4225, longitude: 39.8262 },
    });
  });

  it("returns no results for short or unmatched queries", async () => {
    await expect(provider.searchLocations("M")).resolves.toEqual([]);
    await expect(provider.searchLocations("Atlantis")).resolves.toEqual([]);
  });
});
