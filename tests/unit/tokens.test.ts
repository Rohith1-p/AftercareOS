import { describe, it, expect } from "vitest";
import {
  renderTemplate,
  hasUnfilledTokens,
  smsSegments,
  applyQuietHours,
  computeSendAt,
} from "@/lib/messaging/tokens";

describe("renderTemplate", () => {
  it("replaces known tokens", () => {
    expect(
      renderTemplate("Hi {{first_name}} from {{clinic_name}}!", {
        first_name: "Sarah",
        clinic_name: "Glow",
      }),
    ).toBe("Hi Sarah from Glow!");
  });
  it("removes unknown/empty tokens", () => {
    expect(renderTemplate("Hi {{first_name}}", { clinic_name: "Glow" })).toBe("Hi ");
  });
});

describe("hasUnfilledTokens", () => {
  it("lists remaining tokens", () => {
    expect(hasUnfilledTokens("{{first_name}} book {{book_link}}")).toEqual([
      "first_name",
      "book_link",
    ]);
  });
});

describe("smsSegments", () => {
  it("counts a short message as 1", () => {
    expect(smsSegments("Hello there!")).toBe(1);
  });
  it("counts longer messages as multiple segments", () => {
    const long = "x".repeat(200);
    expect(smsSegments(long)).toBe(2);
  });
});

describe("applyQuietHours", () => {
  it("leaves daytime sends untouched", () => {
    const d = new Date("2026-06-23T10:00:00");
    expect(applyQuietHours(d, "21:00", "07:00")).toEqual(d);
  });
  it("pushes a 23:00 send to 07:00 next morning", () => {
    const d = new Date("2026-06-23T23:00:00");
    const out = applyQuietHours(d, "21:00", "07:00");
    expect(out.getHours()).toBe(7);
    expect(out.getDate()).toBe(24);
  });
  it("pushes a 02:00 send to 07:00 same morning", () => {
    const d = new Date("2026-06-23T02:00:00");
    const out = applyQuietHours(d, "21:00", "07:00");
    expect(out.getHours()).toBe(7);
  });
});

describe("computeSendAt", () => {
  it("adds offset minutes to appointment time", () => {
    const appt = new Date("2026-06-23T14:00:00");
    const out = computeSendAt(appt, 1440); // Day 1
    expect(out.getDate()).toBe(24);
    expect(out.getHours()).toBe(14);
  });
  it("applies quiet hours", () => {
    const appt = new Date("2026-06-23T23:30:00");
    const out = computeSendAt(appt, 60, { start: "21:00", end: "07:00" });
    expect(out.getHours()).toBe(7);
  });
});
