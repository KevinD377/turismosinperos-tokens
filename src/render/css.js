import { cssColor } from "../lib/color.js";
import { fluid, rem } from "../lib/fluid.js";

const GENERIC = new Set(["ui-sans-serif", "ui-serif", "system-ui", "sans-serif", "serif"]);
const family = (list) => list.map((f) => (GENERIC.has(f) ? f : `"${f}"`)).join(", ");
const len = (n) => (n === 0 ? "0" : `${n}px`);

function themeLines(model) {
  const lines = [];
  const ordered = [...model.colors].sort((a, b) => (a.tier === b.tier ? 0 : a.tier === "primitive" ? -1 : 1));
  for (const c of ordered) lines.push(`--color-${c.name}: ${cssColor(c)};`);
  for (const [name, list] of Object.entries(model.fonts)) lines.push(`--font-${name}: ${family(list)};`);
  for (const t of model.text) {
    lines.push(`--text-${t.name}: ${t.fluid ? fluid(t.size.mobile, t.size.desktop) : rem(t.size.mobile)};`);
    lines.push(`--text-${t.name}--line-height: ${t.lineHeight};`);
    if (t.letterSpacingEm !== 0) lines.push(`--text-${t.name}--letter-spacing: ${t.letterSpacingEm}em;`);
    if (t.weight !== 400) lines.push(`--text-${t.name}--font-weight: ${t.weight};`);
  }
  for (const s of model.spacing.filter((s) => s.kind === "fluid")) {
    lines.push(`--spacing-${s.name}: ${fluid(s.mobile, s.desktop)};`);
  }
  for (const c of model.containers) lines.push(`--container-${c.name}: ${c.css};`);
  for (const r of model.radii) lines.push(`--radius-${r.name}: ${r.px >= 9999 ? "9999px" : rem(r.px)};`);
  for (const s of model.shadows) {
    lines.push(`--shadow-${s.name}: ${len(s.offsetX)} ${len(s.offsetY)} ${len(s.blur)} ${len(s.spread)} rgb(${s.rgb.join(" ")} / ${s.alpha});`);
  }
  for (const [name, curve] of Object.entries(model.motion.ease)) lines.push(`--ease-${name}: cubic-bezier(${curve.join(", ")});`);
  return lines;
}

const block = (selector, lines, indent = "") =>
  `${indent}${selector} {\n${lines.map((l) => `${indent}  ${l}`).join("\n")}\n${indent}}`;

export function renderCss(model, version) {
  const responsive = model.spacing.filter((s) => s.kind === "responsive");
  const rootLines = [
    ...responsive.map((s) => `--${s.name}: ${s.mobile}px;`),
    ...Object.entries(model.motion.duration).map(([name, value]) => `--duration-${name}: ${value}ms;`),
    ...model.z.map((z) => `--z-${z.name}: ${z.value};`),
  ];
  const parts = [
    `/* @turismosinperos/tokens v${version} — generado, no editar a mano */`,
    block("@theme", themeLines(model)),
    block("@theme inline", responsive.map((s) => `--spacing-${s.name}: var(--${s.name});`)),
    block(":root", rootLines),
    `@media (min-width: 64rem) {\n${block(":root", responsive.map((s) => `--${s.name}: ${s.desktop}px;`), "  ")}\n}`,
  ];
  return `${parts.join("\n\n")}\n`;
}
