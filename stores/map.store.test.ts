import { describe, expect, it } from "vitest";
import { useMapStore } from "./map.store";

describe("map store", () => {
  it("starts in 3D mode", () => {
    expect(useMapStore.getState().mode).toBe("3d");
  });
});
