import { test, expect } from "@playwright/test";

test("landing page should show login CTA", async ({ page }) => {
  await page.goto("/landing");
  await expect(page.getByRole("link", { name: "Entrar com Google" })).toBeVisible();
});
