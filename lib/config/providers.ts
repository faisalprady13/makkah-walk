import { z } from "zod";

const providerConfigurationSchema = z.object({
  geocoding: z.enum(["mock"]).default("mock"),
  routing: z.enum(["mock"]).default("mock"),
});

export const providerConfiguration = providerConfigurationSchema.parse({
  geocoding: process.env.NEXT_PUBLIC_GEOCODING_PROVIDER,
  routing: process.env.NEXT_PUBLIC_ROUTING_PROVIDER,
});
