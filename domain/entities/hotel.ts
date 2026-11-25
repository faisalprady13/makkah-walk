import type { Location } from "./location";

export interface Hotel extends Location {
  category: "hotel";
  stars?: number;
}
