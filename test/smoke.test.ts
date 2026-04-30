import { describe, expect, it } from "vitest";
import { getNzTaxYear } from "@/lib/tax/rules";

describe("test harness smoke", () => {
  it("imports from the app and runs a trivial assertion", () => {
    // Trivial proves: vitest works, @ alias works, app code is importable.
    // NZ tax year runs 1 April → 31 March; the year ending 31 March 2027 is "2027".
    expect(getNzTaxYear(new Date("2026-04-01"))).toBe(2027);
    expect(getNzTaxYear(new Date("2026-03-31"))).toBe(2026);
  });
});
