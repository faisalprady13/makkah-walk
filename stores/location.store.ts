import { create } from "zustand";
import type { Location } from "@/domain/entities/location";

interface LocationState {
  origin: Location | null;
  destination: Location | null;
  setOrigin: (location: Location | null) => void;
  setDestination: (location: Location | null) => void;
  swapLocations: () => void;
  clearLocations: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  origin: null,
  destination: null,
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  swapLocations: () =>
    set(({ origin, destination }) => ({
      origin: destination,
      destination: origin,
    })),
  clearLocations: () => set({ origin: null, destination: null }),
}));
