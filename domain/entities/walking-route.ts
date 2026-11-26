import { z } from "zod";

export interface RouteInstruction {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  type?: number;
  name?: string;
}

export interface WalkingRoute {
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  distanceMeters: number;
  durationSeconds: number;
  provider: "mock" | "openrouteservice";
  isDemonstration: boolean;
  instructions?: RouteInstruction[];
}

const routePositionSchema = z.tuple([
  z.number().finite().min(-180).max(180),
  z.number().finite().min(-90).max(90),
]);

export const walkingRouteSchema = z.object({
  geometry: z.object({
    type: z.literal("LineString"),
    coordinates: z.array(routePositionSchema).min(2),
  }),
  distanceMeters: z.number().finite().nonnegative(),
  durationSeconds: z.number().finite().nonnegative(),
  provider: z.enum(["mock", "openrouteservice"]),
  isDemonstration: z.boolean(),
  instructions: z
    .array(
      z.object({
        instruction: z.string(),
        distanceMeters: z.number().finite().nonnegative(),
        durationSeconds: z.number().finite().nonnegative(),
        type: z.number().optional(),
        name: z.string().optional(),
      }),
    )
    .optional(),
});
