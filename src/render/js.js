import { rnColor } from "../lib/color.js";
import { camel } from "../lib/names.js";

const round2 = (n) => Math.round(n * 100) / 100;
const camelKeys = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [camel(k), v]));

function textMode(size, t) {
  return { fontSize: size, lineHeight: Math.round(size * t.lineHeight), letterSpacing: round2(size * t.letterSpacingEm) };
}

function groups(model) {
  for (const s of model.shadows) {
    if (s.alpha === 1) throw new Error(`sombra ${s.name}: debe tener alfa`);
  }
  return {
    color: Object.fromEntries(model.colors.map((c) => [camel(c.name), rnColor(c)])),
    font: {
      family: Object.fromEntries(Object.entries(model.fonts).map(([k, list]) => [k, list[0]])),
      weight: model.weights,
    },
    text: Object.fromEntries(
      model.text.map((t) => [
        camel(t.name),
        {
          fontFamily: model.fonts[t.family][0],
          fontWeight: t.weight,
          textTransform: t.transform ?? "none",
          mobile: textMode(t.size.mobile, t),
          desktop: textMode(t.size.desktop, t),
        },
      ]),
    ),
    spacing: Object.fromEntries(model.spacing.map((s) => [camel(s.name), { mobile: s.mobile, desktop: s.desktop }])),
    container: Object.fromEntries(model.containers.filter((c) => c.px !== null).map((c) => [camel(c.name), c.px])),
    radius: Object.fromEntries(model.radii.map((r) => [camel(r.name), r.px])),
    shadow: Object.fromEntries(
      model.shadows.map((s) => [
        camel(s.name),
        { color: rnColor({ hex: "", rgb: s.rgb, alpha: s.alpha }), offsetX: s.offsetX, offsetY: s.offsetY, blur: s.blur, spread: s.spread },
      ]),
    ),
    z: Object.fromEntries(model.z.map((z) => [camel(z.name), z.value])),
    motion: {
      ease: camelKeys(model.motion.ease),
      duration: camelKeys(model.motion.duration),
      distance: camelKeys(model.motion.distance),
      stagger: model.motion.stagger,
      spring: camelKeys(model.motion.spring),
      interaction: model.motion.interaction,
      viewport: model.motion.viewport,
    },
  };
}

export function renderJs(model, version) {
  const g = groups(model);
  const names = Object.keys(g);
  const header = `// @turismosinperos/tokens v${version} — generado, no editar a mano\n`;
  const json = (value) => JSON.stringify(value, null, 2);
  const js =
    header +
    names.map((n) => `export const ${n} = ${json(g[n])};`).join("\n\n") +
    `\n\nexport const tokens = { ${names.join(", ")} };\n`;
  const dts =
    header +
    names.map((n) => `export declare const ${n}: ${json(g[n])};`).join("\n\n") +
    `\n\nexport declare const tokens: {\n${names.map((n) => `  ${n}: typeof ${n};`).join("\n")}\n};\n`;
  return { js, dts };
}
