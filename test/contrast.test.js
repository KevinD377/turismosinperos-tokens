import { describe, expect, it } from "vitest";
import { composite, contrast } from "../src/lib/color.js";
import { loadTokens } from "../src/load.js";
import { buildModel } from "../src/model.js";

const model = buildModel(await loadTokens());
const byName = Object.fromEntries(model.colors.map((c) => [c.name, c]));

// [texto, fondo, mínimo]. Texto 4.5 (AA cuerpo), foco 3 (no-texto).
const PAIRS = [
  ["fg", "surface", 4.5], ["fg", "surface-raised", 4.5], ["fg", "surface-muted", 4.5],
  ["fg-secondary", "surface", 4.5], ["fg-secondary", "surface-raised", 4.5], ["fg-secondary", "surface-muted", 4.5],
  ["fg-accent", "surface", 4.5], ["fg-accent", "surface-raised", 4.5],
  ["fg-positive", "surface", 4.5], ["fg-positive", "surface-raised", 4.5],
  ["fg-inverse", "surface-inverse", 4.5], ["fg-inverse-secondary", "surface-inverse", 4.5], ["fg-inverse-accent", "surface-inverse", 4.5],
  ["action-primary-fg", "action-primary", 4.5], ["action-primary-fg", "action-primary-hover", 4.5],
  ["action-secondary-fg", "action-secondary", 4.5], ["action-secondary-fg", "action-secondary-hover", 4.5],
  ["action-accent-fg", "action-accent", 4.5], ["action-accent-fg", "action-accent-hover", 4.5],
  ["focus", "surface", 3], ["focus", "surface-raised", 3], ["focus-inverse", "surface-inverse", 3],
];

describe("contraste de pares del sistema", () => {
  it.each(PAIRS)("%s sobre %s ≥ %d", (fgName, bgName, min) => {
    const fg = byName[fgName];
    const bg = byName[bgName];
    expect(bg.alpha, `${bgName} debe ser opaco`).toBe(1);
    const visible = composite(fg.rgb, fg.alpha, bg.rgb);
    expect(contrast(visible, bg.rgb)).toBeGreaterThanOrEqual(min);
  });
});
