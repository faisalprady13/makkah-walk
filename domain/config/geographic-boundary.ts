import type { Coordinates } from "../entities/coordinates";

export interface GeographicBoundary {
  name: string;
  polygon: Coordinates[];
}

export const MAKKAH_BOUNDARY: GeographicBoundary = {
  name: "Approximate Makkah area (illustrative)",
  polygon: [
    { latitude: 21.3, longitude: 39.7 },
    { latitude: 21.3, longitude: 39.95 },
    { latitude: 21.56, longitude: 39.95 },
    { latitude: 21.56, longitude: 39.7 },
  ],
};
