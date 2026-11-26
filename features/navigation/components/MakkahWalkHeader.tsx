"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { MapStatus } from "@/stores/map.store";

interface MakkahWalkHeaderProps {
  mapStatus: MapStatus;
}

export function MakkahWalkHeader({ mapStatus }: MakkahWalkHeaderProps) {
  const mapLabel =
    mapStatus === "ready"
      ? "Map ready"
      : mapStatus === "error"
        ? "Map unavailable"
        : "Loading map";

  return (
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
  );
}
