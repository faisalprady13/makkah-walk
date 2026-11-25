import { z } from "zod";
import type { GeocodingProvider } from "@/domain/interfaces/geocoding-provider";
import type { Location } from "@/domain/entities/location";
import sampleLocations from "./sample-locations.json";

const sampleLocationSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(["landmark", "hotel", "transit", "district", "street"]),
    address: z.string(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
);

const locations: Location[] = sampleLocationSchema.parse(sampleLocations).map(
  ({ latitude, longitude, ...location }) => ({
    ...location,
    coordinates: { latitude, longitude },
    source: "sample",
  }),
);

export class MockGeocodingProvider implements GeocodingProvider {
  async searchLocations(query: string): Promise<Location[]> {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (normalizedQuery.length < 2) return [];

    return locations.filter((location) =>
      `${location.name} ${location.address} ${location.category}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }
}
