import type { GeocodingProvider } from "@/domain/interfaces/geocoding-provider";
import type { RoutingProvider } from "@/domain/interfaces/routing-provider";
import { providerConfiguration } from "@/lib/config/providers";
import { MockGeocodingProvider } from "./geocoding/mock-geocoding.provider";
import { MockRoutingProvider } from "./routing/mock-routing.provider";

export const geocodingProvider: GeocodingProvider = (() => {
  switch (providerConfiguration.geocoding) {
    case "mock":
      return new MockGeocodingProvider();
  }
})();

export const routingProvider: RoutingProvider = (() => {
  switch (providerConfiguration.routing) {
    case "mock":
      return new MockRoutingProvider();
  }
})();
