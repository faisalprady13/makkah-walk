"use client";

import type { Hotel } from "@/domain/entities/hotel";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import type { DirectionsStatus } from "@/stores/directions.store";
import {
  formatDistance,
  formatDuration,
} from "@/features/directions/utils/format-route-metrics";

interface HotelPickerProps {
  hotels: readonly Hotel[];
  selectedHotelId: string | null;
  route: WalkingRoute | null;
  routeStatus: DirectionsStatus;
  onSelect: (hotel: Hotel) => void;
}

export function HotelPicker({
  hotels,
  selectedHotelId,
  route,
  routeStatus,
  onSelect,
}: HotelPickerProps) {
  return (
    <aside className="hotel-picker" aria-label="Example hotels">
      <div className="hotel-picker-heading">
        <div>
          <span className="eyebrow">WALK FROM MASJID AL-HARAM</span>
          <h2>Choose a hotel</h2>
        </div>
        <span className="hotel-count">5 EXAMPLES</span>
      </div>
      <p className="hotel-origin">
        Starting point <strong>Masjid al-Haram</strong>
      </p>
      <div className="hotel-picker-list">
        {hotels.map((hotel, index) => {
          const isSelected = selectedHotelId === hotel.id;
          return (
            <button
              key={hotel.id}
              type="button"
              className={`hotel-card${isSelected ? " selected" : ""}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(hotel)}
            >
              <span className="hotel-card-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="hotel-card-copy">
                <strong>{hotel.name}</strong>
                <span>{hotel.address}</span>
                {isSelected && routeStatus === "loading" && (
                  <small className="hotel-card-route" role="status">
                    Calculating walking route…
                  </small>
                )}
                {isSelected && routeStatus === "ready" && route && (
                  <small className="hotel-card-route">
                    {formatDistance(route.distanceMeters)} ·{" "}
                    {formatDuration(route.durationSeconds)}
                  </small>
                )}
              </span>
              {isSelected && <span className="hotel-selected-label">Selected</span>}
            </button>
          );
        })}
      </div>
      <p className="hotel-disclaimer">
        Hotel points from{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap contributors
        </a>
        . Pins mark mapped places, not verified entrances or walking access.
      </p>
    </aside>
  );
}
