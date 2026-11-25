export interface WalkingRoute {
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  distanceMeters: number;
  durationMinutes: number;
  provider: "mock" | "real";
  isDemonstration: boolean;
}
