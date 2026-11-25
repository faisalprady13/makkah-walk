"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDownUp, LocateFixed, MapPin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationSearchField } from "@/features/location-search/components/LocationSearchField";
import { getWalkingRoute } from "@/application/use-cases/get-walking-route";
import {
  geocodingProvider,
  routingProvider,
} from "@/infrastructure/providers/provider-registry";
import { getDeviceCoordinates } from "@/features/geolocation/services/get-device-coordinates";
import { isInsideBoundary } from "@/domain/services/geographic-validation";
import { useDirectionsStore } from "@/stores/directions.store";
import { useLocationStore } from "@/stores/location.store";
import { useMapStore } from "@/stores/map.store";
import type { Location } from "@/domain/entities/location";
import { RouteSummary } from "@/features/directions/components/RouteSummary";

const MapCanvas = dynamic(
  () => import("@/features/map/components/MapCanvas").then((module) => module.MapCanvas),
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

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    if (!origin || !destination) {
      clearRoute();
      return;
    }

    setRouteLoading();
    void getWalkingRoute(
      routingProvider,
      origin.coordinates,
      destination.coordinates,
    )
      .then((walkingRoute) => {
        if (requestId.current === currentRequestId) setRoute(walkingRoute);
      })
      .catch((error: unknown) => {
        if (requestId.current !== currentRequestId) return;
        setRouteError(
          error instanceof Error
            ? error.message
            : "The demonstration route could not be calculated.",
        );
      });
  }, [origin, destination, clearRoute, setRoute, setRouteError, setRouteLoading]);

  async function handleUseMyLocation() {
    setGpsError(null);
    setIsLocating(true);
    try {
      const coordinates = await getDeviceCoordinates();
      if (!isInsideBoundary(coordinates)) {
        setGpsError(
          "Your current position is outside the approximate Makkah area supported by this demo.",
        );
        return;
      }

      const currentLocation: Location = {
        id: "current-location",
        name: "Your location",
        category: "current-location",
        address: "Current device position",
        coordinates,
        source: "device",
      };
      setOrigin(currentLocation);
    } catch (error) {
      setGpsError(
        error instanceof Error
          ? error.message
          : "Your current location is unavailable.",
      );
    } finally {
      setIsLocating(false);
    }
  }

  function handleClear() {
    clearLocations();
    setGpsError(null);
  }

  const mapLabel =
    mapStatus === "ready"
      ? "Map ready"
      : mapStatus === "error"
        ? "Map unavailable"
        : "Loading map";

  return (
    <main className="app-shell">
      <MapCanvas origin={origin} destination={destination} route={route} />

      <header className="app-header">
        <Link className="brand" href="/" aria-label="Makkah Walk home">
          <span className="brand-mark">
            <MapPin size={20} aria-hidden="true" />
          </span>
          <span className="brand-name">
            <strong>Makkah Walk</strong>
            <small>WALKING MAP</small>
          </span>
        </Link>
        <span className="map-status" aria-live="polite">
          <span className={`status-indicator ${mapStatus}`} />
          {mapLabel}
        </span>
      </header>

      <section className="search-panel" aria-label="Plan your walk">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">YOUR JOURNEY</span>
            <h1>Find your way</h1>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="swap-button"
            aria-label="Swap start and destination"
            onClick={swapLocations}
          >
            <ArrowDownUp size={17} />
          </Button>
        </div>
        <div className="search-fields">
          <span className="route-connector" aria-hidden="true" />
          <LocationSearchField
            inputId="origin-search"
            label="STARTING POINT"
            placeholder="Search a place in Makkah"
            selected={origin}
            geocodingProvider={geocodingProvider}
            onSelect={setOrigin}
          />
          <LocationSearchField
            inputId="destination-search"
            label="DESTINATION"
            placeholder="Where would you like to go?"
            selected={destination}
            geocodingProvider={geocodingProvider}
            onSelect={setDestination}
          />
        </div>
        <div className="panel-actions">
          <Button
            type="button"
            variant="outline"
            className="location-button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
          >
            <LocateFixed size={16} aria-hidden="true" />
            {isLocating ? "Finding you…" : "Use my location"}
          </Button>
          {(origin || destination) && (
            <Button
              type="button"
              variant="ghost"
              className="reset-button"
              onClick={handleClear}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
        {gpsError && (
          <p className="inline-error" role="alert">
            {gpsError}
          </p>
        )}
        <div className="sample-note">
          <span aria-hidden="true">i</span>
          Sample places and routes are illustrative, not verified directions.
        </div>
        <div className="route-summary-desktop">
          <RouteSummary route={route} status={routeStatus} error={routeError} />
        </div>
      </section>

      <section className="route-sheet" aria-label="Route details">
        <div className="sheet-handle" aria-hidden="true" />
        <RouteSummary route={route} status={routeStatus} error={routeError} />
      </section>

      <div className="map-welcome" aria-live="polite">
        <span className="welcome-icon">
          <MapPin size={17} aria-hidden="true" />
        </span>
        <div>
          <strong>Explore Makkah</strong>
          <span>
            {origin && destination
              ? "Your demonstration route is ready to preview."
              : "Choose a start and destination to preview a walk."}
          </span>
        </div>
      </div>
    </main>
  );
}
