import type { GeocodingProvider } from "@/domain/interfaces/geocoding-provider";
import { providerConfiguration } from "@/lib/config/providers";
import { MockGeocodingProvider } from "./geocoding/mock-geocoding.provider";

export const geocodingProvider: GeocodingProvider = (() => {
  switch (providerConfiguration.geocoding) {
    case "mock":
      return new MockGeocodingProvider();
  }
})();
