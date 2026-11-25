import type { Location } from "../entities/location";

export interface GeocodingProvider {
  searchLocations(query: string): Promise<Location[]>;
}
