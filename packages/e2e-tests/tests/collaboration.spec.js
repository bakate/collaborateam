import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";

test.describe("Real-time Collaboration", () => {
  test("Two users can collaborate on the same project in real-time", async ({
    browser,
  }) => {
    test.setTimeout(60000);
    const projectName = `E2E_Project_${faker.string.alphanumeric(8)}`;
    const taskTitle = `E2E_Task_${faker.string.alphanumeric(8)}`;

    // USER A Context
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();

    // Register User A
    const emailA = faker.internet.email();
    await pageA.goto("/#/register");
    await pageA
      .getByRole("textbox", { name: /Full name/i })
      .fill(faker.person.fullName());
    await pageA.getByRole("textbox", { name: /Email address/i }).fill(emailA);
    await pageA
      .getByRole("textbox", { name: /Password/i })
      .fill("Password123!");
    await pageA.getByRole("button", { name: /Sign up/i }).click();
    await expect(pageA).toHaveURL("/#/");

    // Create Project
    // Wait for loading to finish if any
    await expect(pageA.getByText(/Loading projects/i)).not.toBeVisible();
    await pageA.getByRole("button", { name: /New Project/i }).click();
    await pageA
      .getByRole("textbox", { name: /Project Name/i })
      .fill(projectName);
    await pageA
      .getByRole("textbox", { name: /Description/i })
      .fill("E2E Description");
    await pageA.getByRole("button", { name: /Create Project/i }).click();

    // Wait for project card and view it
    const projectCard = pageA.locator(".project-card", {
      hasText: projectName,
    });
    await expect(projectCard).toBeVisible();

    // Get project ID from dataset or URL
    await projectCard.getByRole("button", { name: /View/i }).click();
    await expect(pageA).toHaveURL(/\/projects\/[0-9a-f-]+/);
    const projectUrl = pageA.url();

    // USER B Context
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Register User B
    const emailB = faker.internet.email();
    await pageB.goto("/#/register");
    await pageB
      .getByRole("textbox", { name: /Full name/i })
      .fill(faker.person.fullName());
    await pageB.getByRole("textbox", { name: /Email address/i }).fill(emailB);
    await pageB
      .getByRole("textbox", { name: /Password/i })
      .fill("Password123!");
    await pageB.getByRole("button", { name: /Sign up/i }).click();
    await expect(pageB).toHaveURL("/#/");

    // Navigate to User A's project
    await pageB.goto(projectUrl);
    await expect(
      pageB.getByRole("heading", { name: new RegExp(projectName, "i") }),
    ).toBeVisible();

    // User A creates a task
    await pageA.getByRole("button", { name: /Add Task/i }).click();
    await pageA.getByRole("textbox", { name: /Task Title/i }).fill(taskTitle);
    await pageA
      .getByRole("textbox", { name: /Description/i })
      .fill("Task Description");
    await pageA.getByRole("button", { name: /Create Task/i }).click();

    // Check if User B sees the task in real-time (WebSocket)
    const taskCardB = pageB.locator(".task-card", { hasText: taskTitle });
    await expect(taskCardB).toBeVisible({ timeout: 10000 });

    // User A deletes the task
    await pageA
      .locator(".task-card", { hasText: taskTitle })
      .getByRole("button", { name: /Delete/i })
      .click();
    await pageA.getByRole("button", { name: /Confirm/i }).click();

    // Check if task disappears for User B in real-time
    await expect(taskCardB).not.toBeVisible({ timeout: 10000 });
  });
});
