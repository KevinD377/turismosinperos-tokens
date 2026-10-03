import { describe, expect, it } from "vitest";
import { loadTokens } from "../src/load.js";
import { buildModel } from "../src/model.js";
import { renderFigma } from "../src/render/figma.js";

const raw = renderFigma(buildModel(await loadTokens()), "0.1.0");
const figma = JSON.parse(raw);
const collection = (name) => figma.collections.find((c) => c.name === name);
const variable = (col, name) => collection(col).variables.find((v) => v.name === name);

describe("tokens.figma.json", () => {
  it("primitivos y semánticos con alias", () => {
    expect(variable("Primitivos", "color/cherry-950").values.Default).toEqual({ r: 0.149, g: 0.0784, b: 0.102, a: 1 });
    expect(variable("Semánticos", "color/fg").aliasOf).toBe("color/cherry-950");
    expect(variable("Semánticos", "color/fg-secondary")).toMatchObject({ aliasOf: null, values: { Default: { a: 0.7 } } });
  });
  it("modos Mobile/Desktop", () => {
    expect(collection("Responsive").modes).toEqual(["Mobile", "Desktop"]);
    expect(variable("Responsive", "text/display-xl/size").values).toEqual({ Mobile: 44, Desktop: 64 });
    expect(variable("Responsive", "text/display-xl/line-height").values).toEqual({ Mobile: 48, Desktop: 70 });
    expect(variable("Responsive", "spacing/nav-height").values).toEqual({ Mobile: 84, Desktop: 76 });
  });
  it("forma, estilos de texto y efectos", () => {
    expect(variable("Forma", "radius/lg").values).toEqual({ Default: 16 });
    expect(collection("Forma").variables.find((v) => v.name === "container/measure")).toBeUndefined();
    expect(figma.textStyles.find((s) => s.name === "overline")).toMatchObject({
      fontFamily: "Work Sans", fontWeight: 600, textTransform: "uppercase", letterSpacingPercent: 16,
    });
    expect(figma.effectStyles.find((s) => s.name === "shadow/md")).toEqual({
      name: "shadow/md", type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 8 }, radius: 24, spread: 0,
    });
    expect(raw).not.toContain("\r");
    expect(raw.endsWith("}\n")).toBe(true);
  });
});
