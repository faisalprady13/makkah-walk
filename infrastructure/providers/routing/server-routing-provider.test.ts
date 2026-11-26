import { describe, expect, it } from "vitest";
import { MockRoutingProvider } from "./mock-routing.provider";
import { createServerRoutingProvider } from "./server-routing-provider";

describe("createServerRoutingProvider", () => {
  it("defaults to mock routing without requiring an API key", () => {
    expect(createServerRoutingProvider({})).toBeInstanceOf(MockRoutingProvider);
  });

  it("does not silently replace an explicitly selected ORS provider", () => {
    const provider = createServerRoutingProvider({
      ROUTING_PROVIDER: "openrouteservice",
    });

    expect(provider).not.toBeInstanceOf(MockRoutingProvider);
  });

  it("rejects unknown server provider configuration", () => {
    expect(() =>
      createServerRoutingProvider({ ROUTING_PROVIDER: "unknown" }),
    ).toThrow(/ROUTING_PROVIDER/);
  });
});
