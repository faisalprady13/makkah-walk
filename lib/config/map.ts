export const MAKKAH_CENTER: [number, number] = [39.8262, 21.4225];

export const mapConfiguration = {
  styleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
  buildingTileUrl: process.env.NEXT_PUBLIC_BUILDING_TILE_URL,
  buildingSourceLayer:
    process.env.NEXT_PUBLIC_BUILDING_SOURCE_LAYER ?? "building",
};

export const DEFAULT_MAP_STYLE = {
  version: 8 as const,
  sources: {
    openstreetmap: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "openstreetmap",
      type: "raster" as const,
      source: "openstreetmap",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};
