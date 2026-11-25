import { beforeEach, describe, expect, it } from "vitest";
import { useLocationStore } from "./location.store";
import type { Location } from "@/domain/entities/location";

const first: Location = {
  id: "first",
  name: "First",
  category: "landmark",
  address: "Makkah",
  coordinates: { latitude: 21.42, longitude: 39.82 },
  source: "sample",
};
const second: Location = { ...first, id: "second", name: "Second" };

describe("location store", () => {
  beforeEach(() => useLocationStore.getState().clearLocations());

  it("swaps and clears the selected locations", () => {
    const store = useLocationStore.getState();
    store.setOrigin(first);
    store.setDestination(second);
    store.swapLocations();
    expect(useLocationStore.getState()).toMatchObject({
      origin: second,
      destination: first,
    });
    useLocationStore.getState().clearLocations();
    expect(useLocationStore.getState()).toMatchObject({
      origin: null,
      destination: null,
    });
  });
});
