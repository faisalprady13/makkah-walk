import { z } from "zod";
import type { Coordinates } from "@/domain/entities/coordinates";
import { walkingRouteSchema } from "@/domain/entities/walking-route";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import type { RoutingProvider } from "@/domain/interfaces/routing-provider";

const apiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
  }),
});

export class ApiRoutingProvider implements RoutingProvider {
  async getWalkingRoute(
    origin: Coordinates,
    destination: Coordinates,
    signal?: AbortSignal,
  ): Promise<WalkingRoute> {
    let response: Response;
    try {
      response = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination }),
        signal,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new Error("The directions service is unavailable. Please try again.");
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error("The directions service returned an invalid response.");
    }

    if (!response.ok) {
      const parsedError = apiErrorSchema.safeParse(payload);
      throw new Error(
        parsedError.success
          ? parsedError.data.error.message
          : "Unable to calculate a walking route. Please try again.",
      );
    }

    const parsedRoute = walkingRouteSchema.safeParse(payload);
    if (!parsedRoute.success) {
      throw new Error("The directions service returned an invalid route.");
    }

    return parsedRoute.data;
  }
}
