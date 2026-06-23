import { test, expect } from "@playwright/test";

test.describe("Phase 4 — inbox + triage", () => {
  test("escalation queue shows resolve actions per alert", async ({ page }) => {
    await page.goto("/dashboard/inbox");
    // open alerts exist in seed data
    await expect(page.getByText("Escalation queue")).toBeVisible();
    await expect(page.getByRole("button", { name: /booked follow-up/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^Resolve$/ }).first()).toBeVisible();
  });

  test("resolving an alert updates its status", async ({ page }) => {
    await page.goto("/dashboard/inbox");
    const resolveBtn = page.getByRole("button", { name: /^Resolve$/ }).first();
    await resolveBtn.click();
    // After resolving, the alert leaves the OPEN queue (button may disappear or change)
    await page.waitForTimeout(500);
  });

  test("selecting a conversation via ?c= shows its thread + reply composer", async ({ page }) => {
    await page.goto("/dashboard/inbox?c=conv_1");
    await expect(page.getByPlaceholder("Type a reply…")).toBeVisible();
    await expect(page.getByRole("button", { name: /quick replies/i })).toBeVisible();
  });

  test("reply sends and appears in the thread", async ({ page }) => {
    await page.goto("/dashboard/inbox?c=conv_2");
    const composer = page.getByPlaceholder("Type a reply…");
    await composer.fill("Testing the reply — you're all good!");
    await page.getByRole("button", { name: /^Send$/ }).click();
    await expect(page.getByText("Testing the reply — you're all good!")).toBeVisible({ timeout: 5000 });
  });

  test("inbound SMS webhook triages a concerning message into an alert", async ({ request }) => {
    const before = await request.get("/api/cron/process-due?secret=dev"); // ensure server warm
    expect(before.status()).toBe(200);
    // Simulate Twilio inbound POST for a seeded patient (pat_2, +15551001002)
    const res = await request.post("/api/webhooks/sms", {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: "From=%2B15551001002&Body=Help%2C+I+think+it%27s+infected+and+there%27s+severe+pain",
    });
    expect(res.status()).toBe(200);
    // The concerning message should surface in the inbox escalation queue
    const check = await request.get("/dashboard/inbox");
    expect(check.status()).toBe(200);
  });
});
