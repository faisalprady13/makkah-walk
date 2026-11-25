import { describe, expect, it } from "vitest";
import { isInsideBoundary, validateMakkahLocation } from "./geographic-validation";

describe("Makkah geographic validation", () => {
  it("accepts a sample location within the configured area", () => {
    expect(
      validateMakkahLocation({ latitude: 21.4225, longitude: 39.8262 }),
    ).toBeNull();
  });

  it("rejects a location outside the configured area", () => {
    const outside = { latitude: 21.6, longitude: 39.8262 };
    expect(isInsideBoundary(outside)).toBe(false);
    expect(validateMakkahLocation(outside)).toMatch(/outside/i);
  });
});
