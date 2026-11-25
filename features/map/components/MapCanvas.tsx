"use client";

import { useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  GeoJSONSource,
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import type { Location } from "@/domain/entities/location";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import { DEFAULT_MAP_STYLE, MAKKAH_CENTER, mapConfiguration } from "@/lib/config/map";
import { useMapStore } from "@/stores/map.store";
import { Button } from "@/components/ui/button";
import { Box, Layers2 } from "lucide-react";

interface MapCanvasProps {
  origin: Location | null;
  destination: Location | null;
  route: WalkingRoute | null;
}

function locationFeatures(
  origin: Location | null,
  destination: Location | null,
): FeatureCollection<Point, { role: string }> {
  const features: FeatureCollection<Point, { role: string }>["features"] = [];
  if (origin) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [origin.coordinates.longitude, origin.coordinates.latitude],
      },
      properties: { role: "origin" },
    });
  }
  if (destination) {
    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          destination.coordinates.longitude,
          destination.coordinates.latitude,
        ],
      },
      properties: { role: "destination" },
    });
  }
  return { type: "FeatureCollection", features };
}

function syncMapData(
  map: MapLibreMap,
  origin: Location | null,
  destination: Location | null,
  route: WalkingRoute | null,
) {
  const locations = map.getSource("makkah-walk-locations") as
    | GeoJSONSource
    | undefined;
  locations?.setData(locationFeatures(origin, destination));

  const routeSource = map.getSource("makkah-walk-route") as
    | GeoJSONSource
    | undefined;
  routeSource?.setData({
    type: "Feature",
    properties: {},
    geometry: route?.geometry ?? { type: "LineString", coordinates: [] },
  });
}

export function MapCanvas({ origin, destination, route }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const latestData = useRef({ origin, destination, route });
  const status = useMapStore((state) => state.status);
  const mapError = useMapStore((state) => state.error);
  const mode = useMapStore((state) => state.mode);
  const setMode = useMapStore((state) => state.setMode);
  const setStatus = useMapStore((state) => state.setStatus);
  const [buildingError, setBuildingError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setStatus("loading");
    let map: MapLibreMap;
    try {
      setWorkerUrl(`${window.location.origin}/maplibre-gl-worker.mjs`);
      map = new MapLibreMap({
        container,
        style: mapConfiguration.styleUrl || DEFAULT_MAP_STYLE,
        center: MAKKAH_CENTER,
        zoom: 14.2,
        attributionControl: false,
        pitchWithRotate: true,
        cooperativeGestures: true,
      });
      mapRef.current = map;
      map.addControl(
        new NavigationControl({ showCompass: true, visualizePitch: true }),
        "top-right",
      );
      map.addControl(new AttributionControl({ compact: true }), "bottom-right");
    } catch {
      setStatus("error", "The map could not start. Check browser support and map settings.");
      return;
    }

    let isLoaded = false;
    map.on("load", () => {
      isLoaded = true;
      map.addSource("makkah-walk-route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        },
      });
      map.addLayer({
        id: "makkah-walk-route-casing",
        type: "line",
        source: "makkah-walk-route",
        paint: {
          "line-color": "#ffffff",
          "line-width": 9,
          "line-opacity": 0.9,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      });
      map.addLayer({
        id: "makkah-walk-route-line",
        type: "line",
        source: "makkah-walk-route",
        paint: {
          "line-color": "#2563eb",
          "line-width": 5,
          "line-opacity": 0.96,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      });
      map.addSource("makkah-walk-locations", {
        type: "geojson",
        data: locationFeatures(null, null),
      });
      map.addLayer({
        id: "makkah-walk-location-points",
        type: "circle",
        source: "makkah-walk-locations",
        paint: {
          "circle-radius": 8,
          "circle-color": [
            "match",
            ["get", "role"],
            "origin",
            "#16a34a",
            "destination",
            "#2563eb",
            "#64748b",
          ],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      if (mapConfiguration.buildingTileUrl) {
        try {
          map.addSource("makkah-walk-buildings", {
            type: "vector",
            tiles: [mapConfiguration.buildingTileUrl],
            minzoom: 12,
            maxzoom: 17,
          });
          map.addLayer({
            id: "makkah-walk-building-extrusions",
            source: "makkah-walk-buildings",
            "source-layer": mapConfiguration.buildingSourceLayer,
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": "#d6c6af",
              "fill-extrusion-height": [
                "to-number",
                [
                  "coalesce",
                  ["get", "render_height"],
                  ["get", "height"],
                  8,
                ],
              ],
              "fill-extrusion-base": [
                "to-number",
                [
                  "coalesce",
                  ["get", "render_min_height"],
                  ["get", "min_height"],
                  0,
                ],
              ],
              "fill-extrusion-opacity": 0.78,
            },
          });
        } catch {
          setBuildingError(true);
        }
      }

      syncMapData(
        map,
        latestData.current.origin,
        latestData.current.destination,
        latestData.current.route,
      );
      setStatus("ready");
      window.requestAnimationFrame(() => map.resize());
    });

    map.on("error", () => {
      if (!isLoaded) {
        setStatus(
          "error",
          "The map could not load. Check your internet connection and tile configuration.",
        );
      } else {
        setStatus("ready", "Some map tiles failed to load. Check your connection.");
      }
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [setStatus]);

  useEffect(() => {
    latestData.current = { origin, destination, route };
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    syncMapData(map, origin, destination, route);
  }, [origin, destination, route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    map.easeTo({
      pitch: mode === "3d" ? 60 : 0,
      bearing: mode === "3d" ? 18 : 0,
      duration: 900,
    });
  }, [mode, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route || status !== "ready") return;
    const bounds = new LngLatBounds();
    route.geometry.coordinates.forEach((coordinate) => bounds.extend(coordinate));
    if (!bounds.isEmpty()) {
      const isMobile = window.matchMedia("(max-width: 700px)").matches;
      map.fitBounds(bounds, {
        padding: isMobile
          ? { top: 280, bottom: 220, left: 30, right: 30 }
          : { top: 100, bottom: 140, left: 440, right: 90 },
        maxZoom: 16,
        duration: 900,
      });
    }
  }, [route, status]);

  return (
    <div className="map-frame">
      <div ref={containerRef} className="map-canvas" aria-label="Map of Makkah" />
      {status === "loading" && (
        <div className="map-overlay" role="status">
          <span className="loading-dot" />
          Loading map…
        </div>
      )}
      {status === "error" && (
        <div className="map-overlay map-overlay-error" role="alert">
          <strong>Map unavailable</strong>
          <span>{mapError ?? "Try refreshing or check your connection."}</span>
        </div>
      )}
      <div className="map-mode-controls" role="group" aria-label="Map camera mode">
        <Button
          type="button"
          variant={mode === "2d" ? "default" : "outline"}
          size="sm"
          aria-pressed={mode === "2d"}
          onClick={() => setMode("2d")}
        >
          <Layers2 size={15} />
          2D
        </Button>
        <Button
          type="button"
          variant={mode === "3d" ? "default" : "outline"}
          size="sm"
          aria-pressed={mode === "3d"}
          onClick={() => setMode("3d")}
        >
          <Box size={15} />
          3D
        </Button>
      </div>
      {status === "ready" && mapError && (
        <p className="building-note" role="status">{mapError}</p>
      )}
      {mode === "3d" &&
        (!mapConfiguration.buildingTileUrl || buildingError) && (
        <p className="building-note">
          {buildingError
            ? "Camera tilt only · 3D building data could not be loaded"
            : "Camera tilt only · 3D building data is not configured"}
        </p>
      )}
    </div>
  );
}
