import { expect, test } from "@playwright/test";

test.describe("Smoke flow", () => {
  test("landing exibe CTA de login", async ({ page }) => {
    await page.goto("/landing");
    await expect(page.getByRole("link", { name: "Entrar com Google" })).toBeVisible();
  });

  test("releases publica novidades da versão", async ({ page }) => {
    await page.goto("/releases");
    await expect(page.getByRole("heading", { name: "Novidades da versão" })).toBeVisible();
  });

  test("rota privada sem sessão redireciona para login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
