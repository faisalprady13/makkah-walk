# Makkah Walk

A mobile-first walking map MVP for exploring sample locations in Makkah. Search locations, preview an explicitly labeled demonstration route, and switch between top-down and tilted map cameras.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

No API keys are required for the default experience. The default basemap uses OpenStreetMap raster tiles and needs an internet connection; follow the tile provider's usage policy and attribution requirements. Search uses local sample data. Mock routes are illustrative only and are not walking directions or evidence of pedestrian access.

## Optional map configuration

- `NEXT_PUBLIC_MAP_STYLE_URL`: MapLibre style JSON URL. Defaults to OpenStreetMap raster tiles.
- `NEXT_PUBLIC_BUILDING_TILE_URL`: vector tile URL template for optional building extrusions.
- `NEXT_PUBLIC_BUILDING_SOURCE_LAYER`: source layer name in the configured building tiles (defaults to `building`).
- `NEXT_PUBLIC_GEOCODING_PROVIDER`: currently `mock`, using the local sample dataset.
- `ROUTING_PROVIDER`: `mock` by default, or `openrouteservice` to use ORS `foot-walking` directions through the server API.
- `OPENROUTESERVICE_API_KEY`: private server-only key required when `ROUTING_PROVIDER=openrouteservice`. Put it in `.env.local`; never expose it with a `NEXT_PUBLIC_` prefix. Explicitly selecting ORS without a key reports a configuration error and does not fall back to mock routing.

The map can tilt without vector building data; 2D raster tiles do not provide building geometry. The supported Makkah polygon is approximate and illustrative. ORS routes use its OpenStreetMap pedestrian network, but successful routing does not confirm that a path is accessible, safe, open, or accurately mapped. Review the [Makkah route verification checklist](docs/ORS-MAKKAH-VERIFICATION.md) before making any accuracy claims. The API applies an in-process request limit; multi-instance deployments should replace it with shared rate-limit storage.

## Checks

```bash
npm run test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
```

The code is organized by feature, with framework-independent domain contracts, application use cases, local infrastructure providers, and focused Zustand stores. MapLibre is loaded client-side and its instance remains outside global state.
