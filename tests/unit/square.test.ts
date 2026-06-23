import { describe, it, expect } from "vitest";
import { listServices, oauthAuthorizeUrl, SCOPES } from "@/lib/square";

describe("square lib", () => {
  it("requests the right scopes", () => {
    expect(SCOPES).toContain("APPOINTMENTS_READ");
    expect(SCOPES).toContain("CUSTOMERS_READ");
  });

  it("builds an OAuth authorize url with the client id + redirect", () => {
    process.env.SQUARE_APP_ID = "test_app";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";
    const url = oauthAuthorizeUrl("state123");
    expect(url).toContain("client_id=test_app");
    expect(url).toContain("response_type=code");
    expect(url).toContain("state=state123");
    expect(url).toContain("/oauth2/authorize");
    delete process.env.SQUARE_APP_ID;
  });

  it("returns a mock catalog when no real token", async () => {
    const services = await listServices("mock");
    expect(services.length).toBeGreaterThan(0);
    expect(services.some((s) => s.name.toLowerCase().includes("botox"))).toBe(true);
  });

  it("skips signature verification when no webhook key configured (dev)", async () => {
    const { verifySquareSignature } = await import("@/lib/square");
    delete process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    expect(verifySquareSignature("body", "sig", "https://x/y")).toBe(true);
  });
});
