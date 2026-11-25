"use client";

import { AlertTriangle, Clock3, Footprints, Route as RouteIcon } from "lucide-react";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import type { DirectionsStatus } from "@/stores/directions.store";

interface RouteSummaryProps {
  route: WalkingRoute | null;
  status: DirectionsStatus;
  error: string | null;
}

function formatDistance(meters: number): string {
  return meters < 1_000
    ? `${meters} m`
    : `${(meters / 1_000).toFixed(1)} km`;
}

export function RouteSummary({ route, status, error }: RouteSummaryProps) {
  if (status === "idle") {
    return (
      <div className="route-empty">
        <span className="route-empty-icon">
          <RouteIcon size={19} aria-hidden="true" />
        </span>
        <div>
          <strong>Your route will appear here</strong>
          <p>Choose two places to preview a demonstration route.</p>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="route-loading" role="status">
        <span className="loading-dot" />
        Preparing demonstration route…
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
          <strong>Walking route preview</strong>
          <span className="demo-badge">DEMO</span>
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
            <Clock3 size={15} aria-hidden="true" /> {route.durationMinutes} min
          </strong>
          <span>Estimated walk</span>
        </div>
      </div>
      <p className="route-disclaimer">
        Illustrative route only. Not verified for pedestrian access or current conditions.
      </p>
    </div>
  );
}
