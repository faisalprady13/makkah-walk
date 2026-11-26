import { z } from "zod";
import { getWalkingRoute, UnsupportedRouteLocationError } from "@/application/use-cases/get-walking-route";
import { coordinatesSchema } from "@/domain/entities/coordinates";
import { checkRateLimit } from "@/infrastructure/http/in-memory-rate-limiter";
import { createServerRoutingProvider } from "@/infrastructure/providers/routing/server-routing-provider";
import { RoutingProviderError } from "@/infrastructure/providers/routing/routing-provider-error";

const directionsRequestSchema = z
  .object({
    origin: coordinatesSchema,
    destination: coordinatesSchema,
  })
  .strict();

function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

function requestKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function providerErrorResponse(error: RoutingProviderError): Response {
  const responses: Record<
    RoutingProviderError["code"],
    { status: number; code: string; message: string }
  > = {
    configuration: {
      status: 503,
      code: "ROUTING_CONFIGURATION",
      message: error.message,
    },
    invalid_coordinates: {
      status: 400,
      code: "INVALID_COORDINATES",
      message: "Route coordinates are invalid.",
    },
    no_route: {
      status: 422,
      code: "NO_ROUTE",
      message: error.message,
    },
    unauthorized: {
      status: 502,
      code: "ROUTING_AUTHENTICATION_FAILED",
      message: error.message,
    },
    forbidden: {
      status: 502,
      code: "ROUTING_ACCESS_DENIED",
      message: error.message,
    },
    rate_limited: {
      status: 429,
      code: "ROUTING_RATE_LIMITED",
      message: error.message,
    },
    timeout: {
      status: 504,
      code: "ROUTING_TIMEOUT",
      message: error.message,
    },
    unavailable: {
      status: 502,
      code: "ROUTING_UNAVAILABLE",
      message:
        error.upstreamStatus === undefined
          ? error.message
          : `${error.message} (OpenRouteService HTTP ${error.upstreamStatus}).`,
    },
    invalid_response: {
      status: 502,
      code: "INVALID_ROUTING_RESPONSE",
      message: error.message,
    },
  };
  const response = responses[error.code];
  return jsonError(response.status, response.code, response.message);
}

export async function POST(request: Request): Promise<Response> {
  const rateLimit = checkRateLimit(requestKey(request));
  if (!rateLimit.allowed) {
    return Response.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many route requests. Please try again shortly.",
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_REQUEST", "The route request body is invalid.");
  }

  const parsed = directionsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      400,
      "INVALID_REQUEST",
      "Provide valid origin and destination coordinates.",
    );
  }

  try {
    const route = await getWalkingRoute(
      createServerRoutingProvider(),
      parsed.data.origin,
      parsed.data.destination,
      request.signal,
    );
    return Response.json(route);
  } catch (error) {
    if (error instanceof RoutingProviderError) {
      return providerErrorResponse(error);
    }
    if (error instanceof UnsupportedRouteLocationError) {
      return jsonError(422, "OUTSIDE_SUPPORTED_AREA", error.message);
    }
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError(499, "REQUEST_CANCELED", "The route request was canceled.");
    }
    return jsonError(
      500,
      "ROUTING_FAILED",
      "Unable to calculate a walking route. Please try again.",
    );
  }
}
