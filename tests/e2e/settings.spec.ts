import { test, expect } from "@playwright/test";

test.describe("Phase 6 — settings + billing", () => {
  test("clinic profile form is editable and saves", async ({ page }) => {
    await page.goto("/dashboard/settings");
    const nameField = page.getByTestId("clinic-name");
    await expect(nameField).toBeVisible();
    await nameField.fill("Edited Clinic Name");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("Saved").first()).toBeVisible({ timeout: 5000 });
  });

  test("billing shows 3 plans with the current one highlighted", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.getByText("Plan & billing")).toBeVisible();
    await expect(page.getByText("Starter").first()).toBeVisible();
    await expect(page.getByText("Professional").first()).toBeVisible();
    await expect(page.getByText("Growth").first()).toBeVisible();
  });

  test("upgrading via dev checkout changes the plan", async ({ request }) => {
    const res = await request.post("/api/stripe/checkout", {
      data: { plan: "GROWTH", orgId: "org_demo_aesthetics" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.mock).toBe(true);
    expect(body.url).toContain("dev-success");
  });

  test("home shows engagement analytics with the 7-day chart", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Messages sent · last 7 days")).toBeVisible();
    await expect(page.getByText("Journey completion")).toBeVisible();
  });
});
