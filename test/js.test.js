import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { loadTokens } from "../src/load.js";
import { buildModel } from "../src/model.js";
import { renderJs } from "../src/render/js.js";

const { js, dts } = renderJs(buildModel(await loadTokens()), "0.1.0");
const dir = mkdtempSync(path.join(os.tmpdir(), "tsp-tokens-"));
writeFileSync(path.join(dir, "tokens.js"), js);
const mod = await import(pathToFileURL(path.join(dir, "tokens.js")).href);

describe("tokens.js", () => {
  it("rechaza sombras opacas para evitar un color vacío", async () => {
    const model = buildModel(await loadTokens());
    model.shadows[0].alpha = 1;
    expect(() => renderJs(model, "0.1.0")).toThrow("sombra sm: debe tener alfa");
  });
  it("colores para React Native", () => {
    expect(mod.color.cherry950).toBe("#26141A");
    expect(mod.color.fgSecondary).toBe("rgba(38, 20, 26, 0.7)");
    expect(mod.color.scrimStrong).toBe("rgba(0, 0, 0, 0.8)");
  });
  it("tipografía con valores en px por modo", () => {
    expect(mod.text.displayXl).toEqual({
      fontFamily: "Marcellus", fontWeight: 400, textTransform: "none",
      mobile: { fontSize: 44, lineHeight: 48, letterSpacing: -0.88 },
      desktop: { fontSize: 64, lineHeight: 70, letterSpacing: -1.28 },
    });
    expect(mod.text.overline.textTransform).toBe("uppercase");
    expect(mod.text.body.mobile).toEqual({ fontSize: 16, lineHeight: 26, letterSpacing: 0 });
  });
  it("layout, forma y motion", () => {
    expect(mod.spacing.navHeight).toEqual({ mobile: 84, desktop: 76 });
    expect(mod.container).toEqual({ prose: 672, content: 1152, wide: 1280 });
    expect(mod.radius.full).toBe(9999);
    expect(mod.shadow.md).toEqual({ color: "rgba(0, 0, 0, 0.1)", offsetX: 0, offsetY: 8, blur: 24, spread: 0 });
    expect(mod.z.nav).toBe(40);
    expect(mod.motion.ease.inOut).toEqual([0.65, 0, 0.35, 1]);
    expect(mod.motion.duration.fast).toBe(250);
    expect(mod.motion.spring.snappy).toEqual({ stiffness: 500, damping: 32 });
    expect(mod.tokens.color).toBe(mod.color);
  });
  it("tipos y fin de línea", () => {
    expect(dts).toContain("export declare const color: {");
    expect(dts).toContain('"fgSecondary": "rgba(38, 20, 26, 0.7)"');
    expect(dts).toContain("export declare const tokens: {");
    expect(js).not.toContain("\r");
    expect(dts).not.toContain("\r");
  });
});
