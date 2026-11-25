import { expect, test } from "@playwright/test";

test("searches two sample places and previews a labeled route", async ({ page }) => {
  await page.goto("/");

  const originInput = page.getByRole("combobox", { name: "STARTING POINT" });
  const destinationInput = page.getByRole("combobox", { name: "DESTINATION" });

  await originInput.fill("Masjid");
  await expect(page.getByRole("option", { name: /Masjid al-Haram/ })).toBeVisible();
  await page.getByRole("option", { name: /Masjid al-Haram/ }).click();
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
