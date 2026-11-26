import { describe, expect, it } from "vitest";
import { coordinatesSchema } from "./coordinates";

describe("coordinatesSchema", () => {
  it("accepts finite latitude and longitude within geographic ranges", () => {
    expect(
      coordinatesSchema.safeParse({ latitude: 21.4225, longitude: 39.8262 }).success,
    ).toBe(true);
  });

  it.each([
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: -181 },
    { latitude: Number.POSITIVE_INFINITY, longitude: 0 },
    { latitude: 0, longitude: Number.NaN },
  ])("rejects invalid coordinates: %o", (coordinates) => {
    expect(coordinatesSchema.safeParse(coordinates).success).toBe(false);
  });
});
