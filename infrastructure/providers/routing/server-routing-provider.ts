import { z } from "zod";
import type { RoutingProvider } from "@/domain/interfaces/routing-provider";
import { MockRoutingProvider } from "./mock-routing.provider";
import { OpenRouteServiceProvider } from "./openrouteservice.provider";
import { RoutingProviderError } from "./routing-provider-error";

const providerNameSchema = z.enum(["mock", "openrouteservice"]);

export interface ServerRoutingEnvironment {
  ROUTING_PROVIDER?: string;
  OPENROUTESERVICE_API_KEY?: string;
}

export function createServerRoutingProvider(
  environment?: ServerRoutingEnvironment,
): RoutingProvider {
  const serverEnvironment = environment ?? {
    ROUTING_PROVIDER: process.env.ROUTING_PROVIDER,
    OPENROUTESERVICE_API_KEY: process.env.OPENROUTESERVICE_API_KEY,
  };
  const providerName = providerNameSchema.safeParse(
    serverEnvironment.ROUTING_PROVIDER ?? "mock",
  );
  if (!providerName.success) {
    throw new RoutingProviderError(
      "configuration",
      "ROUTING_PROVIDER must be either mock or openrouteservice.",
    );
  }

  if (providerName.data === "mock") return new MockRoutingProvider();

  return new OpenRouteServiceProvider({
    apiKey: serverEnvironment.OPENROUTESERVICE_API_KEY,
  });
}
