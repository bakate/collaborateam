import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";

test.describe("Authentication & Guards", () => {
  test("Redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("/#/");
    // Should be redirected because / is protected
    await expect(page).toHaveURL("/#/login");
  });

  test("Redirects to /login when trying to access /projects/new without auth", async ({
    page,
  }) => {
    await page.goto("/#/projects/new");
    await expect(page).toHaveURL("/#/login");
  });

  test("Allows access to protected routes after registration", async ({
    page,
  }) => {
    const email = faker.internet.email();
    const password = "Password123!";

    await page.goto("/#/register");
    await page
      .getByRole("textbox", { name: /Full name/i })
      .fill(faker.person.fullName());
    await page.getByRole("textbox", { name: /Email address/i }).fill(email);
    await page.getByRole("textbox", { name: /Password/i }).fill(password);
    await page.getByRole("button", { name: /Sign up/i }).click();

    await expect(page).toHaveURL("/#/");

    // Check if header shows logout button to confirm session
    await expect(page.getByRole("button", { name: /Logout/i })).toBeVisible();

    // Now try accessing a protected route
    await page.goto("/#/projects/new");
    await expect(page).toHaveURL("/#/projects/new");
    await expect(
      page.getByRole("heading", { name: /New Project/i }),
    ).toBeVisible();
  });
});
