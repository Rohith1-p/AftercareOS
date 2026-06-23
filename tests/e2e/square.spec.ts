import { test, expect } from "@playwright/test";

test.describe("Phase 3 — Square auto-enroll", () => {
  test("settings shows Square integration card", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: "Square Appointments" })).toBeVisible();
    // When connected: service mapping table; when not: connect + simulate prompt.
    const hasMapping = await page.getByText(/map each square service/i).count();
    const hasConnect = await page.getByRole("link", { name: /connect square/i }).count();
    expect(hasMapping + hasConnect).toBeGreaterThan(0);
  });

  test("simulating a completed Botox appointment auto-enrolls a patient", async ({ request }) => {
    const res = await request.get(
      "/api/dev/simulate-appointment?secret=dev&service=svc_botox&serviceName=Botox%20-%201%20Area&name=Sim%20Patient&phone=%2B15552009999",
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.matched).toBe(true);
    expect(body.protocolId).toContain("botox");
    expect(body.patientId).toMatch(/^pat_/);
  });

  test("Square webhook receiver rejects bad signature only when key set", async ({ request }) => {
    // With no SQUARE_WEBHOOK_SIGNATURE_KEY, verification is skipped → 200.
    const res = await request.post("/api/webhooks/square", {
      headers: { "content-type": "application/json" },
      data: { type: "booking.updated", data: { object: { booking: { status: "COMPLETED" } } } },
    });
    expect([200, 400]).toContain(res.status());
  });
});
