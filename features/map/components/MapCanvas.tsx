'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl';
import type { Location } from '@/domain/entities/location';
import type { Hotel } from '@/domain/entities/hotel';
import type { WalkingRoute } from '@/domain/entities/walking-route';
import {
  DEFAULT_MAP_STYLE,
  MAKKAH_CENTER,
  mapConfiguration,
} from '@/lib/config/map';
import { syncMapData } from '@/features/map/services/sync-map-data';
import { useMapStore } from '@/stores/map.store';
import { Button } from '@/components/ui/button';
import { Box, Layers2 } from 'lucide-react';

interface MapCanvasProps {
  origin: Location | null;
  destination: Location | null;
  route: WalkingRoute | null;
  hotelRouteOrigin: Location;
  showHotelRouteOriginMarker: boolean;
  hotels: readonly Hotel[];
  selectedHotelId: string | null;
  // onSelectHotel: (hotel: Hotel) => void;
}

interface HotelMarkerRecord {
  marker: Marker;
  element: HTMLButtonElement;
}

function getMapPadding(isMobile: boolean) {
  return isMobile
    ? { top: 360, bottom: 310, left: 30, right: 30 }
    : { top: 100, bottom: 140, left: 440, right: 380 };
}

export function MapCanvas({
  origin,
  destination,
  route,
  hotelRouteOrigin,
  showHotelRouteOriginMarker,
  hotels,
  selectedHotelId,
  // onSelectHotel,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hotelMarkersRef = useRef(new Map<string, HotelMarkerRecord>());
  // const hotelSelectionHandlerRef = useRef(onSelectHotel);
  const latestData = useRef({ origin, destination, route });
  const status = useMapStore((state) => state.status);
  const mapError = useMapStore((state) => state.error);
  const mode = useMapStore((state) => state.mode);
  const setMode = useMapStore((state) => state.setMode);
  const setStatus = useMapStore((state) => state.setStatus);
  const [buildingError, setBuildingError] = useState(false);

  // useEffect(() => {
  //   hotelSelectionHandlerRef.current = onSelectHotel;
  // }, [onSelectHotel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setStatus('loading');
    let map: MapLibreMap;
    try {
      setWorkerUrl(`${window.location.origin}/maplibre-gl-worker.mjs`);
      map = new MapLibreMap({
        container,
        style: mapConfiguration.styleUrl || DEFAULT_MAP_STYLE,
        center: MAKKAH_CENTER,
        zoom: 14.2,
        bearing: 90,
        pitch: 60,
        dragRotate: true,
        touchZoomRotate: true,
        touchPitch: true,
        attributionControl: false,
        pitchWithRotate: true,
        cooperativeGestures: true,
      });
      map.setPadding(
        getMapPadding(window.matchMedia('(max-width: 700px)').matches),
      );
      mapRef.current = map;
      map.addControl(
        new NavigationControl({ showCompass: true, visualizePitch: true }),
        'top-right',
      );
      map.addControl(new AttributionControl({ compact: true }), 'bottom-right');
    } catch {
      setStatus(
        'error',
        'The map could not start. Check browser support and map settings.',
      );
      return;
    }

    let isLoaded = false;
    map.on('load', () => {
      isLoaded = true;
      map.addSource('makkah-walk-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      });
      map.addLayer({
        id: 'makkah-walk-route-casing',
        type: 'line',
        source: 'makkah-walk-route',
        paint: {
          'line-color': '#ffffff',
          'line-width': 9,
          'line-opacity': 0.9,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });
      map.addLayer({
        id: 'makkah-walk-route-line',
        type: 'line',
        source: 'makkah-walk-route',
        paint: {
          'line-color': '#2563eb',
          'line-width': 5,
          'line-opacity': 0.96,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });
      map.addSource('makkah-walk-locations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'makkah-walk-location-points',
        type: 'circle',
        source: 'makkah-walk-locations',
        paint: {
          'circle-radius': 8,
          'circle-color': [
            'match',
            ['get', 'role'],
            'origin',
            '#16a34a',
            'destination',
            '#2563eb',
            '#64748b',
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });

      if (mapConfiguration.buildingTileUrl) {
        try {
          map.addSource('makkah-walk-buildings', {
            type: 'vector',
            tiles: [mapConfiguration.buildingTileUrl],
            minzoom: 12,
            maxzoom: 17,
          });
          map.addLayer({
            id: 'makkah-walk-building-extrusions',
            source: 'makkah-walk-buildings',
            'source-layer': mapConfiguration.buildingSourceLayer,
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': '#d6c6af',
              'fill-extrusion-height': [
                'to-number',
                ['coalesce', ['get', 'render_height'], ['get', 'height'], 8],
              ],
              'fill-extrusion-base': [
                'to-number',
                [
                  'coalesce',
                  ['get', 'render_min_height'],
                  ['get', 'min_height'],
                  0,
                ],
              ],
              'fill-extrusion-opacity': 0.78,
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
      setStatus('ready');
      window.requestAnimationFrame(() => map.resize());
    });

    map.on('error', () => {
      if (!isLoaded) {
        setStatus(
          'error',
          'The map could not load. Check your internet connection and tile configuration.',
        );
      } else {
        setStatus(
          'ready',
          'Some map tiles failed to load. Check your connection.',
        );
      }
    });

    let mobilePadding = window.matchMedia('(max-width: 700px)').matches;
    const resizeObserver = new ResizeObserver(() => {
      const nextMobilePadding = window.matchMedia('(max-width: 700px)').matches;
      if (nextMobilePadding !== mobilePadding) {
        mobilePadding = nextMobilePadding;
        map.setPadding(getMapPadding(mobilePadding));
      }
      map.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [setStatus]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const originMarker = showHotelRouteOriginMarker
      ? new Marker({
          element: document.createElement('div'),
          anchor: 'center',
        })
      : null;
    if (originMarker) {
      const element = originMarker.getElement();
      element.className = 'masjid-origin-marker';
      element.textContent = 'A';
      element.setAttribute('role', 'img');
      element.setAttribute('aria-label', 'Starting point: Masjid al-Haram');
      originMarker
        .setLngLat([
          hotelRouteOrigin.coordinates.longitude,
          hotelRouteOrigin.coordinates.latitude,
        ])
        .addTo(map);
    }

    const markerRecords = new Map<string, HotelMarkerRecord>();
    // hotels.forEach((hotel, index) => {
    //   const element = document.createElement('button');
    //   element.type = 'button';
    //   element.className = 'hotel-map-marker';
    //   const numberLabel = document.createElement('span');
    //   numberLabel.className = 'hotel-map-marker-number';
    //   numberLabel.textContent = String(index + 1);
    //   element.append(numberLabel);
    //   element.setAttribute(
    //     'aria-label',
    //     `Select hotel ${index + 1}: ${hotel.name}`,
    //   );
    //   element.setAttribute('aria-pressed', 'false');
    //   element.addEventListener('click', (event) => {
    //     event.stopPropagation();
    //     hotelSelectionHandlerRef.current(hotel);
    //   });

    //   const marker = new Marker({
    //     element,
    //     anchor: 'bottom',
    //     pitchAlignment: 'viewport',
    //     rotationAlignment: 'viewport',
    //   })
    //     .setLngLat([hotel.coordinates.longitude, hotel.coordinates.latitude])
    //     .addTo(map);
    //   markerRecords.set(hotel.id, { marker, element });
    // });
    hotelMarkersRef.current = markerRecords;

    return () => {
      originMarker?.remove();
      markerRecords.forEach(({ marker }) => marker.remove());
      hotelMarkersRef.current = new Map();
    };
  }, [hotelRouteOrigin, hotels, showHotelRouteOriginMarker]);

  useEffect(() => {
    hotelMarkersRef.current.forEach(({ element }, hotelId) => {
      const isSelected = hotelId === selectedHotelId;
      element.classList.toggle('selected', isSelected);
      element.setAttribute('aria-pressed', String(isSelected));
    });
  }, [selectedHotelId, hotels]);

  useEffect(() => {
    latestData.current = { origin, destination, route };
    const map = mapRef.current;
    if (!map || !map.getSource('makkah-walk-route')) return;
    syncMapData(map, origin, destination, route);
  }, [origin, destination, route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    map.easeTo({
      pitch: mode === '3d' ? 60 : 0,
      bearing: mode === '3d' ? 90 : 0,
      duration: 900,
    });
  }, [mode, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    const bounds = new LngLatBounds();
    route?.geometry.coordinates.forEach((coordinate) =>
      bounds.extend(coordinate),
    );
    bounds.extend([
      hotelRouteOrigin.coordinates.longitude,
      hotelRouteOrigin.coordinates.latitude,
    ]);
    hotels.forEach((hotel) => {
      bounds.extend([hotel.coordinates.longitude, hotel.coordinates.latitude]);
    });
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        maxZoom: 16,
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        duration: route ? 900 : 0,
      });
    }
  }, [hotelRouteOrigin, hotels, route, status]);

  return (
    <div className="map-frame">
      <div
        ref={containerRef}
        className="map-canvas"
        aria-label="Map of Makkah"
      />
      {status === 'loading' && (
        <div className="map-overlay" role="status">
          <span className="loading-dot" />
          Loading map…
        </div>
      )}
      {status === 'error' && (
        <div className="map-overlay map-overlay-error" role="alert">
          <strong>Map unavailable</strong>
          <span>{mapError ?? 'Try refreshing or check your connection.'}</span>
        </div>
      )}
      <div
        className="map-mode-controls"
        role="group"
        aria-label="Map camera mode"
      >
        <Button
          type="button"
          variant={mode === '2d' ? 'default' : 'outline'}
          size="sm"
          aria-pressed={mode === '2d'}
          onClick={() => setMode('2d')}
        >
          <Layers2 size={15} />
          2D
        </Button>
        <Button
          type="button"
          variant={mode === '3d' ? 'default' : 'outline'}
          size="sm"
          aria-pressed={mode === '3d'}
          onClick={() => setMode('3d')}
        >
          <Box size={15} />
          3D
        </Button>
      </div>
      {status === 'ready' && mapError && (
        <p className="building-note" role="status">
          {mapError}
        </p>
      )}
      {mode === '3d' &&
        (!mapConfiguration.buildingTileUrl || buildingError) && (
          <p className="building-note">
            {buildingError
              ? 'Camera tilt only · 3D building data could not be loaded'
              : 'Camera tilt only · 3D building data is not configured'}
          </p>
        )}
    </div>
  );
}
