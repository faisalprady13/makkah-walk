"use client";

import { AlertTriangle, Clock3, Footprints, Route as RouteIcon } from "lucide-react";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import type { Location } from "@/domain/entities/location";
import type { DirectionsStatus } from "@/stores/directions.store";
import {
  formatDistance,
  formatDuration,
} from "@/features/directions/utils/format-route-metrics";

interface RouteSummaryProps {
  route: WalkingRoute | null;
  status: DirectionsStatus;
  error: string | null;
  origin: Location | null;
  destination: Location | null;
}

export function RouteSummary({
  route,
  status,
  error,
  origin,
  destination,
}: RouteSummaryProps) {
  if (status === "idle") {
    return (
      <div className="route-empty">
        <span className="route-empty-icon">
          <RouteIcon size={19} aria-hidden="true" />
        </span>
        <div>
          <strong>Your route will appear here</strong>
          <p>Choose two places to preview a walking route.</p>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="route-loading" role="status">
        <span className="loading-dot" />
        Finding a walking route…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="route-error" role="alert">
        <AlertTriangle size={18} aria-hidden="true" />
        <span>{error}</span>
      </div>
    );
  }

  if (!route) return null;

  return (
    <div className="route-summary">
      <div className="route-summary-title">
        <span className="route-summary-icon">
          <Footprints size={18} aria-hidden="true" />
        </span>
        <div>
          <strong>{route.isDemonstration ? "Walking route preview" : "Walking route"}</strong>
          <span className={route.isDemonstration ? "demo-badge" : "route-provider-badge"}>
            {route.isDemonstration ? "DEMO" : "OpenRouteService"}
          </span>
          <span className="route-ready-label">READY</span>
        </div>
      </div>
      <div className="route-endpoints">
        <div>
          <span>From</span>
          <strong>{origin?.name ?? "Starting point"}</strong>
        </div>
        <div>
          <span>To</span>
          <strong>{destination?.name ?? "Destination"}</strong>
        </div>
      </div>
      <div className="route-metrics">
        <div>
          <strong>{formatDistance(route.distanceMeters)}</strong>
          <span>Distance</span>
        </div>
        <div className="metric-divider" />
        <div>
          <strong>
            <Clock3 size={15} aria-hidden="true" /> {formatDuration(route.durationSeconds)}
          </strong>
          <span>Provider estimate</span>
        </div>
      </div>
      <p className="route-disclaimer">
        {route.isDemonstration
          ? "Illustrative route only. Not verified for pedestrian access or current conditions."
          : "OpenRouteService pedestrian data is not independently verified for accessibility, safety, or current conditions."}
      </p>
    </div>
  );
}
