import { z } from "zod";
import { coordinatesSchema } from "@/domain/entities/coordinates";
import type { Coordinates } from "@/domain/entities/coordinates";
import type { WalkingRoute } from "@/domain/entities/walking-route";
import type { RoutingProvider } from "@/domain/interfaces/routing-provider";
import { RoutingProviderError } from "./routing-provider-error";

const endpoint =
  "https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson";
const longitudeSchema = z.number().finite().min(-180).max(180);
const latitudeSchema = z.number().finite().min(-90).max(90);

const orsPositionSchema = z
  .tuple([longitudeSchema, latitudeSchema])
  .rest(z.number().finite());

const orsStepSchema = z.object({
  instruction: z.string(),
  distance: z.number().finite().nonnegative(),
  duration: z.number().finite().nonnegative(),
  type: z.number().optional(),
  name: z.string().optional(),
});

const orsResponseSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      type: z.literal("Feature"),
      geometry: z.object({
        type: z.literal("LineString"),
        coordinates: z.array(orsPositionSchema),
      }),
      properties: z.object({
        summary: z.object({
          distance: z.number().finite().nonnegative(),
          duration: z.number().finite().nonnegative(),
        }),
        segments: z
          .array(
            z.object({
              steps: z.array(orsStepSchema).optional(),
            }),
          )
          .optional(),
      }),
    }),
  ),
});

export interface OpenRouteServiceProviderOptions {
  apiKey?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export function toOpenRouteServiceCoordinate(
  coordinates: Coordinates,
): [longitude: number, latitude: number] {
  const parsed = coordinatesSchema.safeParse(coordinates);
  if (!parsed.success) {
    throw new RoutingProviderError(
      "invalid_coordinates",
      "Route coordinates are invalid.",
    );
  }

  return [parsed.data.longitude, parsed.data.latitude];
}

export class OpenRouteServiceProvider implements RoutingProvider {
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: OpenRouteServiceProviderOptions) {
    this.fetcher = options.fetcher ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  async getWalkingRoute(
    origin: Coordinates,
    destination: Coordinates,
    signal?: AbortSignal,
  ): Promise<WalkingRoute> {
    const coordinates = [
      toOpenRouteServiceCoordinate(origin),
      toOpenRouteServiceCoordinate(destination),
    ];
    const apiKey = this.options.apiKey?.trim();
    if (!apiKey) {
      throw new RoutingProviderError(
        "configuration",
        "OpenRouteService is selected, but OPENROUTESERVICE_API_KEY is not configured.",
      );
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    const abortRequest = () => controller.abort();
    signal?.addEventListener("abort", abortRequest, { once: true });
    if (signal?.aborted) controller.abort();

    let response: Response | null = null;
    let payload: unknown;
    try {
      response = await this.fetcher(endpoint, {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/geo+json, application/json",
        },
        body: JSON.stringify({ coordinates }),
        signal: controller.signal,
      });
      if (response.ok) payload = await response.json();
    } catch {
      if (signal?.aborted) {
        throw new DOMException("The route request was canceled.", "AbortError");
      }
      if (timedOut) {
        throw new RoutingProviderError(
          "timeout",
          "The walking route request timed out. Please try again.",
        );
      }
      if (response) {
        throw new RoutingProviderError(
          "invalid_response",
          "The walking service returned an invalid route.",
        );
      }
      throw new RoutingProviderError(
        "unavailable",
        "The walking service is unavailable. Please try again.",
      );
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abortRequest);
    }

    if (!response) {
      throw new RoutingProviderError(
        "unavailable",
        "The walking service is temporarily unavailable. Please try again.",
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new RoutingProviderError(
          "unauthorized",
          "The walking service could not authenticate. Check its server configuration.",
        );
      }
      if (response.status === 403) {
        throw new RoutingProviderError(
          "forbidden",
          "The walking service denied access. Check provider access or quota.",
        );
      }
      if (response.status === 429) {
        throw new RoutingProviderError(
          "rate_limited",
          "The walking service is busy. Please try again later.",
        );
      }
      if (response.status === 404 || response.status === 400 || response.status === 422) {
        throw new RoutingProviderError(
          "no_route",
          "No pedestrian route is available between these locations.",
        );
      }
      throw new RoutingProviderError(
        "unavailable",
        "The walking service is temporarily unavailable. Please try again.",
        response.status,
      );
    }

    const parsed = orsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new RoutingProviderError(
        "invalid_response",
        "The walking service returned an invalid route.",
      );
    }

    const feature = parsed.data.features[0];
    if (!feature || feature.geometry.coordinates.length < 2) {
      throw new RoutingProviderError(
        "no_route",
        "No pedestrian route is available between these locations.",
      );
    }

    const instructions = feature.properties.segments?.flatMap((segment) =>
      (segment.steps ?? []).map((step) => ({
        instruction: step.instruction,
        distanceMeters: step.distance,
        durationSeconds: step.duration,
        ...(step.type === undefined ? {} : { type: step.type }),
        ...(step.name === undefined ? {} : { name: step.name }),
      })),
    );

    return {
      geometry: {
        type: "LineString",
        coordinates: feature.geometry.coordinates.map(
          ([longitude, latitude]) => [longitude, latitude],
        ),
      },
      distanceMeters: feature.properties.summary.distance,
      durationSeconds: feature.properties.summary.duration,
      provider: "openrouteservice",
      isDemonstration: false,
      ...(instructions?.length ? { instructions } : {}),
    };
  }
}
