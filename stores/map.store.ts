import { create } from "zustand";

export type MapMode = "2d" | "3d";
export type MapStatus = "loading" | "ready" | "error";

interface MapState {
  mode: MapMode;
  status: MapStatus;
  error: string | null;
  setMode: (mode: MapMode) => void;
  setStatus: (status: MapStatus, error?: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  mode: "2d",
  status: "loading",
  error: null,
  setMode: (mode) => set({ mode }),
  setStatus: (status, error = null) => set({ status, error }),
}));
