import { describe, expect, it } from "vitest";
import { composite, contrast, cssColor, figmaColor, hexToRgb, rnColor } from "../src/lib/color.js";

describe("hexToRgb", () => {
  it("convierte #RRGGBB", () => {
    expect(hexToRgb("#26141A")).toEqual([38, 20, 26]);
    expect(hexToRgb("#f2f4f3")).toEqual([242, 244, 243]);
  });
  it("rechaza formatos no soportados", () => {
    expect(() => hexToRgb("#fff")).toThrow(/hex inválido/);
    expect(() => hexToRgb("#26141AB3")).toThrow(/hex inválido/);
    expect(() => hexToRgb("rgb(0,0,0)")).toThrow(/hex inválido/);
  });
});

describe("composite y contrast", () => {
  const cherry = [38, 20, 26];
  const humo = [242, 244, 243];
  it("cherry-950 sobre humo da 15.88", () => {
    expect(contrast(cherry, humo)).toBeCloseTo(15.88, 1);
  });
  it("cherry-950 al 70 % sobre humo da 6.24", () => {
    expect(contrast(composite(cherry, 0.7, humo), humo)).toBeCloseTo(6.24, 1);
  });
  it("alfa 1 devuelve el color original", () => {
    expect(composite(cherry, 1, humo)).toEqual(cherry);
  });
});

describe("impresión por plataforma", () => {
  const solid = { hex: "#26141A", rgb: [38, 20, 26], alpha: 1 };
  const translucent = { hex: "#26141A", rgb: [38, 20, 26], alpha: 0.7 };
  it("css", () => {
    expect(cssColor(solid)).toBe("#26141A");
    expect(cssColor(translucent)).toBe("rgb(38 20 26 / 0.7)");
  });
  it("react native", () => {
    expect(rnColor(solid)).toBe("#26141A");
    expect(rnColor(translucent)).toBe("rgba(38, 20, 26, 0.7)");
  });
  it("figma", () => {
    expect(figmaColor(translucent)).toEqual({ r: 0.149, g: 0.0784, b: 0.102, a: 0.7 });
  });
});
