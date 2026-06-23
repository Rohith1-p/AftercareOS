import { test, expect } from "@playwright/test";

const SECTIONS = [
  { path: "/dashboard", heading: "Today" },
  { path: "/dashboard/journeys", heading: "Journeys & Protocols" },
  { path: "/dashboard/patients", heading: "Patients & Enrollments" },
  { path: "/dashboard/inbox", heading: "Inbox" },
  { path: "/dashboard/reviews", heading: "Reviews & Reputation" },
  { path: "/dashboard/settings", heading: "Settings" },
];

test.describe("Phase 0 — app shell", () => {
  test("root redirects to /dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("sidebar shows all six nav items + brand", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("aside")).toContainText("AftercareOS");
    for (const label of ["Home", "Journeys", "Patients", "Inbox", "Reviews", "Settings"]) {
      await expect(page.locator("aside")).toContainText(label);
    }
  });

  for (const s of SECTIONS) {
    test(`section ${s.path} renders heading "${s.heading}"`, async ({ page }) => {
      const res = await page.goto(s.path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1").first()).toContainText(s.heading);
    });
  }

  test("journeys library lists 5 protocol cards", async ({ page }) => {
    await page.goto("/dashboard/journeys");
    await expect(page.locator("text=Botox / Wrinkle Relaxer")).toBeVisible();
    await expect(page.locator("text=Chemical Peel")).toBeVisible();
  });

  test("protocol detail page shows the timeline", async ({ page }) => {
    await page.goto("/dashboard/journeys/proto_botox");
    await expect(page.locator("text=Message timeline")).toBeVisible();
    await expect(page.getByText(/Day 1/).first()).toBeVisible();
  });

  test("home shows the needs-attention panel + stat cards", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Active journeys", { exact: true })).toBeVisible();
    await expect(page.getByText("Open alerts", { exact: true })).toBeVisible();
  });
});
