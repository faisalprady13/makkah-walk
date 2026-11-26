import { expect, test } from "@playwright/test";
import { z } from "zod";
import { coordinatesSchema } from "@/domain/entities/coordinates";
import { MockRoutingProvider } from "@/infrastructure/providers/routing/mock-routing.provider";

const transparentTile = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=",
  "base64",
);
const directionsRequestSchema = z.object({
  origin: coordinatesSchema,
  destination: coordinatesSchema,
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/directions", async (requestRoute) => {
    const request = directionsRequestSchema.parse(
      requestRoute.request().postDataJSON(),
    );
    const walkingRoute = await new MockRoutingProvider().getWalkingRoute(
      request.origin,
      request.destination,
    );
    await requestRoute.fulfill({ json: walkingRoute });
  });
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: transparentTile,
    }),
  );
});

test("searches two sample places and previews a labeled route", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "3D" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  const originInput = page.getByRole("combobox", { name: "STARTING POINT" });
  const destinationInput = page.getByRole("combobox", { name: "DESTINATION" });

  await originInput.fill("Masjid");
  await expect(page.getByRole("option", { name: /Masjid al-Haram/ })).toBeVisible();
  await originInput.press("ArrowDown");
  await originInput.press("Enter");
  await destinationInput.fill("Ajyad");
  await expect(page.getByRole("option", { name: /Ajyad Hotel/ })).toBeVisible();
  await destinationInput.press("ArrowDown");
  await destinationInput.press("Enter");

  const directionsPanel = page.getByRole("region", { name: "Plan your walk" });
  await expect(directionsPanel.getByText("Walking route preview")).toBeVisible();
  await expect(
    directionsPanel.getByText("Illustrative route only.", { exact: false }),
  ).toBeVisible();

  await page.getByRole("button", { name: "3D" }).click();
  await expect(page.getByText(/Camera tilt only/)).toBeVisible();
  await page.getByRole("button", { name: "2D" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("region", { name: "Route details" }).getByText("Walking route preview"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Swap start and destination" }).click();
  await expect(originInput).toHaveValue("Ajyad Hotel");
  await expect(destinationInput).toHaveValue("Masjid al-Haram");

  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(originInput).toHaveValue("");
  await expect(destinationInput).toHaveValue("");
});

test("selects numbered example hotels by card and map marker", async ({ page }) => {
  await page.goto("/");

  const hotelPicker = page.getByRole("complementary", { name: "Example hotels" });
  await expect(page.getByText("Map ready")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Zoom in" }).click();
  await page
    .getByRole("button", { name: "Select hotel 4: Tharawat Naba Makkah Hotel" })
    .click();
  await expect(
    page.getByRole("combobox", { name: "STARTING POINT" }),
  ).toHaveValue("Masjid al-Haram");
  await expect(
    page.getByRole("combobox", { name: "DESTINATION" }),
  ).toHaveValue("Tharawat Naba Makkah Hotel");
  await expect(
    page.getByRole("region", { name: "Plan your walk" }).getByText("Walking route preview"),
  ).toBeVisible();

  const firstHotel = hotelPicker.getByRole("button", {
    name: /Al Fajer Al Badya 2 Hotel/,
  });
  await firstHotel.click();

  await expect(firstHotel).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("combobox", { name: "DESTINATION" }),
  ).toHaveValue("Al Fajer Al Badya 2 Hotel");
});
