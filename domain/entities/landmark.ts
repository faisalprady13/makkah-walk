import type { Location } from "./location";

export interface Landmark extends Location {
  category: "landmark";
}
