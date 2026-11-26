import { describe, expect, it } from "vitest";
import { isInsideBoundary } from "@/domain/services/geographic-validation";
import { HOTEL_ROUTE_ORIGIN, SAMPLE_HOTELS } from "./sample-hotels";

describe("sample hotel destinations", () => {
  it("provides five uniquely numbered example locations within the supported area", () => {
    expect(SAMPLE_HOTELS).toHaveLength(5);
    expect(new Set(SAMPLE_HOTELS.map((hotel) => hotel.id)).size).toBe(5);
    expect(SAMPLE_HOTELS.every((hotel) => isInsideBoundary(hotel.coordinates))).toBe(
      true,
    );
    expect(isInsideBoundary(HOTEL_ROUTE_ORIGIN.coordinates)).toBe(true);
    expect(SAMPLE_HOTELS.map((hotel) => hotel.name)).toEqual([
      "Al Fajer Al Badya 2 Hotel",
      "Makkah Millennium Hotel",
      "Sheraton Makkah - Jabal Al Kaaba Hotel",
      "Tharawat Naba Makkah Hotel",
      "Hotel Pullmann ZamZam Makkah",
    ]);
    expect(SAMPLE_HOTELS.every((hotel) => hotel.id.startsWith("osm-"))).toBe(true);
  });
});
