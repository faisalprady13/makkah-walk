"use client";

import { ArrowDownUp, LocateFixed, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Location } from "@/domain/entities/location";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import type { DirectionsStatus } from "@/stores/directions.store";
import type { GeocodingProvider } from "@/domain/interfaces/geocoding-provider";
import { LocationSearchField } from "@/features/location-search/components/LocationSearchField";
import { RouteSummary } from "@/features/directions/components/RouteSummary";

interface RoutePlannerProps {
  origin: Location | null;
  destination: Location | null;
  route: WalkingRoute | null;
  routeStatus: DirectionsStatus;
  routeError: string | null;
  geocodingProvider: GeocodingProvider;
  isLocating: boolean;
  gpsError: string | null;
  onSelectOrigin: (location: Location | null) => void;
  onSelectDestination: (location: Location | null) => void;
  onSwap: () => void;
  onUseMyLocation: () => void;
  onClear: () => void;
}

export function RoutePlanner({
  origin,
  destination,
  route,
  routeStatus,
  routeError,
  geocodingProvider,
  isLocating,
  gpsError,
  onSelectOrigin,
  onSelectDestination,
  onSwap,
  onUseMyLocation,
  onClear,
}: RoutePlannerProps) {
  return (
    <>
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
            onClick={onSwap}
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
            onSelect={onSelectOrigin}
          />
          <LocationSearchField
            inputId="destination-search"
            label="DESTINATION"
            placeholder="Where would you like to go?"
            selected={destination}
            geocodingProvider={geocodingProvider}
            onSelect={onSelectDestination}
          />
        </div>
        <div className="panel-actions">
          <Button
            type="button"
            variant="outline"
            className="location-button"
            onClick={onUseMyLocation}
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
              onClick={onClear}
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
          Sample places are illustrative; routes are not verified for pedestrian access.
        </div>
        <div className="route-summary-desktop">
          <RouteSummary
            route={route}
            status={routeStatus}
            error={routeError}
            origin={origin}
            destination={destination}
          />
        </div>
      </section>

      <section className="route-sheet" aria-label="Route details">
        <div className="sheet-handle" aria-hidden="true" />
        <RouteSummary
          route={route}
          status={routeStatus}
          error={routeError}
          origin={origin}
          destination={destination}
        />
      </section>
    </>
  );
}
