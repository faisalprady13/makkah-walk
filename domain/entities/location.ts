import type { Coordinates } from "./coordinates";

export type LocationCategory =
  | "landmark"
  | "hotel"
  | "transit"
  | "district"
  | "street"
  | "current-location";

export type LocationSource = "sample" | "device";

export interface Location {
  id: string;
  name: string;
  category: LocationCategory;
  address: string;
  coordinates: Coordinates;
  source: LocationSource;
}
