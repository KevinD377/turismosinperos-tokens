import { describe, expect, it } from "vitest";
import { fluid, rem } from "../src/lib/fluid.js";
import { camel } from "../src/lib/names.js";

describe("fluid reproduce exactamente los valores del spec", () => {
  it.each([
    [44, 64, "clamp(2.75rem, 2.232rem + 2.210vw, 4rem)"],
    [32, 48, "clamp(2rem, 1.586rem + 1.768vw, 3rem)"],
    [24, 32, "clamp(1.5rem, 1.293rem + 0.884vw, 2rem)"],
    [20, 24, "clamp(1.25rem, 1.146rem + 0.442vw, 1.5rem)"],
    [64, 128, "clamp(4rem, 2.343rem + 7.072vw, 8rem)"],
    [16, 80, "clamp(1rem, -0.657rem + 7.072vw, 5rem)"],
  ])("fluid(%i, %i)", (min, max, expected) => {
    expect(fluid(min, max)).toBe(expected);
  });
  it("rechaza min mayor que max", () => {
    expect(() => fluid(64, 44)).toThrow(/min/);
  });
});

describe("rem", () => {
  it("convierte px a rem sin ceros sobrantes", () => {
    expect(rem(44)).toBe("2.75rem");
    expect(rem(16)).toBe("1rem");
    expect(rem(672)).toBe("42rem");
  });
});

describe("camel", () => {
  it.each([
    ["fg-secondary", "fgSecondary"],
    ["cherry-950", "cherry950"],
    ["in-out", "inOut"],
    ["display-xl", "displayXl"],
    ["humo", "humo"],
  ])("%s → %s", (input, expected) => {
    expect(camel(input)).toBe(expected);
  });
});
