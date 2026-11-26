'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { getWalkingRoute } from '@/application/use-cases/get-walking-route';
import { geocodingProvider } from '@/infrastructure/providers/provider-registry';
import { ApiRoutingProvider } from '@/infrastructure/providers/routing/api-routing.provider';
import { getDeviceCoordinates } from '@/features/geolocation/services/get-device-coordinates';
import { isInsideBoundary } from '@/domain/services/geographic-validation';
import { useDirectionsStore } from '@/stores/directions.store';
import { useLocationStore } from '@/stores/location.store';
import { useMapStore } from '@/stores/map.store';
import type { Location } from '@/domain/entities/location';
import type { Hotel } from '@/domain/entities/hotel';
import { HotelPicker } from '@/features/hotels/components/HotelPicker';
import { MakkahWalkHeader } from '@/features/navigation/components/MakkahWalkHeader';
import { MapWelcome } from '@/features/navigation/components/MapWelcome';
import { RoutePlanner } from '@/features/navigation/components/RoutePlanner';
import {
  HOTEL_ROUTE_ORIGIN,
  SAMPLE_HOTELS,
} from '@/features/hotels/data/sample-hotels';

const routingProvider = new ApiRoutingProvider();

const MapCanvas = dynamic(
  () =>
    import('@/features/map/components/MapCanvas').then(
      (module) => module.MapCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="map-placeholder" role="status">
        Preparing Makkah map…
      </div>
    ),
  },
);

export function MakkahWalkApp() {
  const origin = useLocationStore((state) => state.origin);
  const destination = useLocationStore((state) => state.destination);
  const setOrigin = useLocationStore((state) => state.setOrigin);
  const setDestination = useLocationStore((state) => state.setDestination);
  const setLocations = useLocationStore((state) => state.setLocations);
  const swapLocations = useLocationStore((state) => state.swapLocations);
  const clearLocations = useLocationStore((state) => state.clearLocations);
  const route = useDirectionsStore((state) => state.route);
  const routeStatus = useDirectionsStore((state) => state.status);
  const routeError = useDirectionsStore((state) => state.error);
  const setRoute = useDirectionsStore((state) => state.setRoute);
  const setRouteLoading = useDirectionsStore((state) => state.setLoading);
  const setRouteError = useDirectionsStore((state) => state.setError);
  const clearRoute = useDirectionsStore((state) => state.clearRoute);
  const mapStatus = useMapStore((state) => state.status);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const requestId = useRef(0);
  const selectedHotelId =
    origin?.id === HOTEL_ROUTE_ORIGIN.id
      ? (SAMPLE_HOTELS.find((hotel) => hotel.id === destination?.id)?.id ??
        null)
      : null;

  function handleSelectHotel(hotel: Hotel) {
    setLocations(HOTEL_ROUTE_ORIGIN, hotel);
    setGpsError(null);
  }

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    const controller = new AbortController();
    if (!origin || !destination) {
      clearRoute();
      return;
    }

    setRouteLoading();
    void getWalkingRoute(
      routingProvider,
      origin.coordinates,
      destination.coordinates,
      controller.signal,
    )
      .then((walkingRoute) => {
        if (requestId.current === currentRequestId) setRoute(walkingRoute);
      })
      .catch((error: unknown) => {
        if (requestId.current !== currentRequestId || controller.signal.aborted)
          return;
        setRouteError(
          error instanceof Error
            ? error.message
            : 'The walking route could not be calculated.',
        );
      });
    return () => controller.abort();
  }, [
    origin,
    destination,
    clearRoute,
    setRoute,
    setRouteError,
    setRouteLoading,
  ]);

  async function handleUseMyLocation() {
    setGpsError(null);
    setIsLocating(true);
    try {
      const coordinates = await getDeviceCoordinates();
      if (!isInsideBoundary(coordinates)) {
        setGpsError(
          'Your current position is outside the approximate Makkah area supported by this demo.',
        );
        return;
      }

      const currentLocation: Location = {
        id: 'current-location',
        name: 'Your location',
        category: 'current-location',
        address: 'Current device position',
        coordinates,
        source: 'device',
      };
      setOrigin(currentLocation);
    } catch (error) {
      setGpsError(
        error instanceof Error
          ? error.message
          : 'Your current location is unavailable.',
      );
    } finally {
      setIsLocating(false);
    }
  }

  function handleClear() {
    clearLocations();
    setGpsError(null);
  }

  return (
    <main className="app-shell">
      <MapCanvas
        origin={origin}
        destination={destination}
        route={route}
        hotelRouteOrigin={HOTEL_ROUTE_ORIGIN}
        showHotelRouteOriginMarker={
          !origin || origin.id === HOTEL_ROUTE_ORIGIN.id
        }
        hotels={SAMPLE_HOTELS}
        selectedHotelId={selectedHotelId}
        // onSelectHotel={handleSelectHotel}
      />

      <MakkahWalkHeader mapStatus={mapStatus} />

      <RoutePlanner
        origin={origin}
        destination={destination}
        route={route}
        routeStatus={routeStatus}
        routeError={routeError}
        geocodingProvider={geocodingProvider}
        isLocating={isLocating}
        gpsError={gpsError}
        onSelectOrigin={setOrigin}
        onSelectDestination={setDestination}
        onSwap={swapLocations}
        onUseMyLocation={handleUseMyLocation}
        onClear={handleClear}
      />

      <HotelPicker
        hotels={SAMPLE_HOTELS}
        selectedHotelId={selectedHotelId}
        route={route}
        routeStatus={routeStatus}
        onSelect={handleSelectHotel}
      />

      <MapWelcome
        origin={origin}
        destination={destination}
        route={route}
        routeStatus={routeStatus}
      />
    </main>
  );
}
