import { test, expect } from "@playwright/test";

test.describe("Phase 2 — enroll + escalation", () => {
  test("enroll dialog opens, fields render", async ({ page }) => {
    await page.goto("/dashboard/patients");
    await page.getByRole("button", { name: /enroll patient/i }).click();
    await expect(page.getByRole("button", { name: "New patient" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Existing/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enroll patient" })).toBeVisible();
  });

  test("enrolling a new patient lands on the timeline page", async ({ page }) => {
    await page.goto("/dashboard/patients");
    await page.getByRole("button", { name: /enroll patient/i }).click();
    // New patient mode
    await page.getByPlaceholder("Sarah Mitchell").fill("E2E Test Patient");
    await page.getByPlaceholder("(555) 100-2003").fill("(555) 200-0009");
    await page.getByRole("button", { name: /start journey/i }).click();
    await page.waitForURL(/\/dashboard\/patients\/pat_/);
    await expect(page.getByRole("heading", { name: "E2E Test Patient" })).toBeVisible();
    await expect(page.getByText("Aftercare timeline")).toBeVisible();
  });

  test("public escalation page renders and accepts a concern", async ({ page }) => {
    await page.goto("/w/demo-token");
    await expect(page.getByRole("heading", { name: /tell us what/i })).toBeVisible();
    // pick Urgent severity
    await page.getByRole("button", { name: /emergency/i }).click();
    await page.getByPlaceholder(/more swollen/i).fill("Severe pain and spreading redness.");
    await page.getByRole("button", { name: /send to clinic/i }).click();
    await expect(page.getByText(/message sent/i)).toBeVisible();
    // The concern should now appear in the dashboard inbox
    await page.goto("/dashboard/inbox");
    await expect(page.getByText("Severe pain and spreading redness.").first()).toBeVisible();
  });

  test("manual cron endpoint processes due messages (mock)", async ({ request }) => {
    const res = await request.get("/api/cron/process-due?secret=dev");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("processed");
    expect(body).toHaveProperty("sent");
  });
});
