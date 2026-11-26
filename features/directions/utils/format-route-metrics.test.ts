import { describe, expect, it } from "vitest";
import {
  formatDistance,
  formatDuration,
} from "./format-route-metrics";

describe("route metric formatting", () => {
  it("uses meters for short routes and kilometers for longer routes", () => {
    expect(formatDistance(612.4)).toBe("612 m");
    expect(formatDistance(1_250)).toBe("1.3 km");
  });

  it("uses minutes for short durations and hours plus minutes for long durations", () => {
    expect(formatDuration(1_470)).toBe("25 min");
    expect(formatDuration(3_600)).toBe("1 hr");
    expect(formatDuration(3_660)).toBe("1 hr 1 min");
  });
});
