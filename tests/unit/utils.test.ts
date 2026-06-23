import { describe, it, expect } from "vitest";
import { cn, toE164, maskPhone, initials, formatDate } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("dedupes conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("toE164", () => {
  it("formats 10-digit US number", () => {
    expect(toE164("5551234567")).toBe("+15551234567");
  });
  it("formats 11-digit with leading 1", () => {
    expect(toE164("15551234567")).toBe("+15551234567");
  });
  it("passes through already-E.164", () => {
    expect(toE164("+15551234567")).toBe("+15551234567");
  });
});

describe("maskPhone", () => {
  it("masks middle digits", () => {
    expect(maskPhone("+15551234567")).toBe("+1 (555) ··· ···7");
  });
});

describe("initials", () => {
  it("takes first letters of first two words", () => {
    expect(initials("Sarah Mitchell")).toBe("SM");
  });
  it("handles single name", () => {
    expect(initials("Sarah")).toBe("S");
  });
});

describe("formatDate", () => {
  it("formats a date", () => {
    const out = formatDate("2026-06-23T00:00:00Z");
    expect(out).toMatch(/2026/);
  });
});
