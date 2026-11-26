"use client";

import { MapPin } from "lucide-react";
import type { Location } from "@/domain/entities/location";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import type { DirectionsStatus } from "@/stores/directions.store";

interface MapWelcomeProps {
  origin: Location | null;
  destination: Location | null;
  route: WalkingRoute | null;
  routeStatus: DirectionsStatus;
}

export function MapWelcome({
  origin,
  destination,
  route,
  routeStatus,
}: MapWelcomeProps) {
  const message =
    origin && destination
      ? route?.isDemonstration
        ? "Your demonstration route is ready to preview."
        : route
          ? "Your walking route is ready to review."
          : routeStatus === "loading"
            ? "Calculating your walking route."
            : "Your route request needs attention."
      : "Choose a start and destination to preview a walk.";

  return (
    <div className="map-welcome" aria-live="polite">
      <span className="welcome-icon">
        <MapPin size={17} aria-hidden="true" />
      </span>
      <div>
        <strong>Explore Makkah</strong>
        <span>{message}</span>
      </div>
    </div>
  );
}
