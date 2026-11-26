import { create } from "zustand";
import type { WalkingRoute } from "@/domain/entities/walking-route";

export type DirectionsStatus = "idle" | "loading" | "ready" | "error";

interface DirectionsState {
  route: WalkingRoute | null;
  status: DirectionsStatus;
  error: string | null;
  setLoading: () => void;
  setRoute: (route: WalkingRoute) => void;
  setError: (message: string) => void;
  clearRoute: () => void;
}

export const useDirectionsStore = create<DirectionsState>((set) => ({
  route: null,
  status: "idle",
  error: null,
  setLoading: () => set({ route: null, status: "loading", error: null }),
  setRoute: (route) => set({ route, status: "ready", error: null }),
  setError: (error) => set({ route: null, status: "error", error }),
  clearRoute: () => set({ route: null, status: "idle", error: null }),
}));
