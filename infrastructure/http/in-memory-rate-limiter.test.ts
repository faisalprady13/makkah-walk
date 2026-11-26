import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./in-memory-rate-limiter";

describe("checkRateLimit", () => {
  it("limits requests in a window and allows requests after the window expires", () => {
    const key = "test-rate-limit-window";

    expect(checkRateLimit(key, 1_000, 2, 5_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2_000, 2, 5_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3_000, 2, 5_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 3,
    });
    expect(checkRateLimit(key, 6_000, 2, 5_000).allowed).toBe(true);
  });
});
