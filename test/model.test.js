import { describe, expect, it } from "vitest";
import { loadTokens } from "../src/load.js";
import { buildModel } from "../src/model.js";

const model = buildModel(await loadTokens());
const color = (name) => model.colors.find((c) => c.name === name);

const token = (overrides) => ({
  path: ["color", "x"],
  $type: "color",
  $value: "#26141A",
  original: { $value: "#26141A" },
  filePath: "tokens/semantic/color.json",
  ...overrides,
});
const primitive = token({ path: ["color", "cherry-950"], filePath: "tokens/primitive/color.json" });

describe("modelo real", () => {
  it("tiene 10 primitivos y los semánticos del spec", () => {
    expect(model.colors.filter((c) => c.tier === "primitive")).toHaveLength(10);
    expect(color("fg-secondary")).toEqual({
      name: "fg-secondary", tier: "semantic", hex: "#26141A", rgb: [38, 20, 26], alpha: 0.7, ref: "cherry-950",
    });
    expect(color("scrim-medium")).toMatchObject({ rgb: [0, 0, 0], alpha: 0.55 });
  });
  it("normaliza tipografía", () => {
    expect(model.text.find((t) => t.name === "display-xl")).toEqual({
      name: "display-xl", family: "display", weight: 400, size: { mobile: 44, desktop: 64 }, fluid: true,
      lineHeight: 1.1, letterSpacingEm: -0.02, transform: null,
    });
    expect(model.text.find((t) => t.name === "overline")).toMatchObject({
      weight: 600, size: { mobile: 11, desktop: 11 }, fluid: false, transform: "uppercase", letterSpacingEm: 0.16,
    });
  });
  it("normaliza layout, forma y motion", () => {
    expect(model.spacing).toContainEqual({ name: "nav-height", kind: "responsive", mobile: 84, desktop: 76 });
    expect(model.spacing).toContainEqual({ name: "gutter", kind: "fluid", mobile: 16, desktop: 80 });
    expect(model.containers).toContainEqual({ name: "measure", px: null, css: "65ch" });
    expect(model.containers).toContainEqual({ name: "prose", px: 672, css: "42rem" });
    expect(model.radii).toContainEqual({ name: "lg", px: 16 });
    expect(model.shadows).toContainEqual({ name: "md", offsetX: 0, offsetY: 8, blur: 24, spread: 0, rgb: [0, 0, 0], alpha: 0.1 });
    expect(model.z).toContainEqual({ name: "toast", value: 70 });
    expect(model.motion.duration.slow).toBe(600);
    expect(model.motion.ease.out).toEqual([0.22, 1, 0.36, 1]);
    expect(model.motion.interaction.hoverLift).toBe(-2);
  });
});

describe("reglas de la marca", () => {
  it("un semántico con hex crudo falla", () => {
    expect(() => buildModel([primitive, token({ path: ["color", "malo"] })])).toThrow(/malo.*referencia/);
  });
  it("alfa sobre un semántico falla", () => {
    const fg = token({ path: ["color", "fg"], original: { $value: "{color.cherry-950}" } });
    const bad = token({
      path: ["color", "fg-x"],
      original: { $value: "{color.fg}" },
      $extensions: { "com.turismosinperos": { alpha: 0.5 } },
    });
    expect(() => buildModel([primitive, fg, bad])).toThrow(/fg-x.*primitivo/);
  });
  it("un texto bajo 11 px falla", () => {
    const tiny = {
      path: ["text", "mini"], $type: "typography", filePath: "tokens/semantic/text.json",
      $value: { fontFamily: ["Work Sans"], fontWeight: 400, fontSize: "10px", lineHeight: 1.4, letterSpacing: "0em" },
      original: { $value: { fontFamily: "{font.family.sans}" } },
    };
    expect(() => buildModel([primitive, tiny])).toThrow(/mini.*11px/);
  });
  it("una referencia rota hace fallar la carga", async () => {
    await expect(loadTokens(["test/fixtures/broken/*.json"])).rejects.toThrow();
  });
});


describe("validación completa de las reglas de marca", () => {
  it("un velo de cherry falla", () => {
    const scrim = token({
      path: ["color", "scrim-soft"], original: { $value: "{color.cherry-950}" },
      $extensions: { "com.turismosinperos": { alpha: 0.4 } },
    });
    expect(() => buildModel([primitive, scrim])).toThrow(/scrim-soft.*negro/);
  });
  it("una sombra de cherry falla", () => {
    const shadow = {
      path: ["shadow", "tintada"], $type: "shadow", filePath: "tokens/semantic/shape.json",
      $value: { color: "#26141A", offsetX: "0px", offsetY: "2px", blur: "8px", spread: "0px" },
      $extensions: { "com.turismosinperos": { alpha: 0.1 } },
    };
    expect(() => buildModel([shadow])).toThrow(/tintada.*negro/);
  });
  it("el piso tipográfico también se valida en desktop", () => {
    const tiny = {
      path: ["text", "mini-desktop"], $type: "typography", filePath: "tokens/semantic/text.json",
      $value: { fontFamily: ["Work Sans"], fontWeight: 400, fontSize: "11px", lineHeight: 1.4, letterSpacing: "0em" },
      original: { $value: { fontFamily: "{font.family.sans}" } },
      $extensions: { "com.turismosinperos": { fluidMax: "10px" } },
    };
    expect(() => buildModel([tiny])).toThrow(/mini-desktop.*11px/);
  });
  it("una referencia semántica tiene que apuntar a color", () => {
    const bad = token({ path: ["color", "no-color"], original: { $value: "{font.family.sans}" } });
    expect(() => buildModel([primitive, bad])).toThrow(/no-color.*referencia.*color/);
  });
  it.each([-0.1, 1.1, NaN, "0.7"])("rechaza alfa inválido %s", (alpha) => {
    const bad = token({
      path: ["color", "bad-alpha"], original: { $value: "{color.cherry-950}" },
      $extensions: { "com.turismosinperos": { alpha } },
    });
    expect(() => buildModel([primitive, bad])).toThrow(/bad-alpha.*alfa/);
  });
  it("alfa explícito 1 tampoco se permite sobre un semántico", () => {
    const fg = token({ path: ["color", "fg"], original: { $value: "{color.cherry-950}" } });
    const bad = token({
      path: ["color", "fg-x"], original: { $value: "{color.fg}" },
      $extensions: { "com.turismosinperos": { alpha: 1 } },
    });
    expect(() => buildModel([primitive, fg, bad])).toThrow(/fg-x.*primitivo/);
  });
});
