# Makkah Walk

A mobile-first walking map MVP for exploring sample locations in Makkah. Search locations, preview an explicitly labeled demonstration route, and switch between top-down and tilted map cameras.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

No API keys are required. The default basemap uses OpenStreetMap raster tiles and needs an internet connection; follow the tile provider's usage policy and attribution requirements. Search and routing use local sample data. Neither sample places nor demonstration geometry are verified walking directions or evidence of pedestrian access.

## Optional map configuration

- `NEXT_PUBLIC_MAP_STYLE_URL`: MapLibre style JSON URL. Defaults to OpenStreetMap raster tiles.
- `NEXT_PUBLIC_BUILDING_TILE_URL`: vector tile URL template for optional building extrusions.
- `NEXT_PUBLIC_BUILDING_SOURCE_LAYER`: source layer name in the configured building tiles (defaults to `building`).
- `NEXT_PUBLIC_GEOCODING_PROVIDER` and `NEXT_PUBLIC_ROUTING_PROVIDER`: currently accept `mock` only. Real provider implementations can be added behind the interfaces in `domain/interfaces` and selected through `infrastructure/providers/provider-registry.ts`.

The map can tilt without vector building data; 2D raster tiles do not provide building geometry. The supported Makkah polygon is approximate and illustrative.

## Checks

```bash
npm run test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
```

The code is organized by feature, with framework-independent domain contracts, application use cases, local infrastructure providers, and focused Zustand stores. MapLibre is loaded client-side and its instance remains outside global state.
