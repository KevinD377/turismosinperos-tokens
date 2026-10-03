import { hexToRgb } from "./lib/color.js";
import { rem } from "./lib/fluid.js";

const EXT = "com.turismosinperos";
const MIN_TEXT_PX = 11;

const ext = (t) => t.$extensions?.[EXT] ?? {};
const leaf = (t, depth = 1) => t.path.slice(depth).join("-");
const isColorRef = (value) => typeof value === "string" && /^\{color\.[^{}]+\}$/.test(value);
const refName = (value) => value.slice(1, -1).split(".").slice(1).join("-");

function parseUnit(value, unit, label) {
  const match = new RegExp(`^(-?\\d+(?:\\.\\d+)?)${unit}$`).exec(String(value));
  if (!match) throw new Error(`${label}: se esperaba un valor en ${unit}, llegó "${value}"`);
  return Number(match[1]);
}
const px = (value, label) => parseUnit(value, "px", label);
const ms = (value, label) => parseUnit(value, "ms", label);
const em = (value, label) => parseUnit(value, "em", label);

function alphaOf(t, name) {
  const alpha = ext(t).alpha ?? 1;
  if (typeof alpha !== "number" || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    throw new Error(`${name}: el alfa debe ser un número entre 0 y 1`);
  }
  return alpha;
}

function requireBlack(rgb, name) {
  if (rgb.some((channel) => channel !== 0)) throw new Error(`${name}: debe ser negro`);
}

function buildColors(tokens) {
  const isPrimitive = (t) => t.filePath.replaceAll("\\", "/").includes("/primitive/");
  const primitives = new Set(tokens.filter(isPrimitive).map((t) => leaf(t)));
  return tokens.map((t) => {
    const name = leaf(t);
    const alpha = alphaOf(t, name);
    const rgb = hexToRgb(t.$value);
    if (name.startsWith("scrim-")) requireBlack(rgb, name);
    if (isPrimitive(t)) {
      if (alpha !== 1) throw new Error(`${name}: un primitivo no lleva alfa`);
      return { name, tier: "primitive", hex: t.$value.toUpperCase(), rgb, alpha, ref: null };
    }
    const original = t.original.$value;
    if (!isColorRef(original)) throw new Error(`${name}: un semántico debe ser una referencia a color, no "${original}"`);
    const ref = refName(original);
    if (Object.hasOwn(ext(t), "alpha") && !primitives.has(ref)) {
      throw new Error(`${name}: el alfa solo se aplica sobre un primitivo, no sobre "${ref}"`);
    }
    return { name, tier: "semantic", hex: t.$value.toUpperCase(), rgb, alpha, ref };
  });
}

function buildText(tokens) {
  return tokens.map((t) => {
    const name = leaf(t);
    const v = t.$value;
    const mobile = px(v.fontSize, name);
    const fluidMax = ext(t).fluidMax;
    const desktop = fluidMax ? px(fluidMax, name) : mobile;
    if (Math.min(mobile, desktop) < MIN_TEXT_PX) throw new Error(`${name}: ${Math.min(mobile, desktop)}px está bajo el piso de ${MIN_TEXT_PX}px`);
    return {
      name,
      family: refName(t.original.$value.fontFamily).replace(/^family-/, ""),
      weight: Number(v.fontWeight),
      size: { mobile, desktop },
      fluid: Boolean(fluidMax),
      lineHeight: Number(v.lineHeight),
      letterSpacingEm: em(v.letterSpacing, name),
      transform: ext(t).textTransform ?? null,
    };
  });
}

function buildSpacing(tokens) {
  return tokens.map((t) => {
    const name = leaf(t);
    const e = ext(t);
    const mobile = px(t.$value, name);
    if (e.fluidMax) return { name, kind: "fluid", mobile, desktop: px(e.fluidMax, name) };
    if (e.desktop) return { name, kind: "responsive", mobile, desktop: px(e.desktop, name) };
    return { name, kind: "fixed", mobile, desktop: mobile };
  });
}

function buildContainers(tokens) {
  return tokens.map((t) => {
    const name = leaf(t);
    const value = String(t.$value);
    if (value.endsWith("px")) {
      const size = px(value, name);
      return { name, px: size, css: rem(size) };
    }
    return { name, px: null, css: value };
  });
}

function buildShadows(tokens) {
  return tokens.map((t) => {
    const name = leaf(t);
    const v = t.$value;
    const rgb = hexToRgb(v.color);
    requireBlack(rgb, name);
    return {
      name,
      offsetX: px(v.offsetX, name),
      offsetY: px(v.offsetY, name),
      blur: px(v.blur, name),
      spread: px(v.spread, name),
      rgb,
      alpha: alphaOf(t, name),
    };
  });
}

function buildMotion(tokens) {
  const get = (...path) => {
    const found = tokens.find((t) => t.path.join(".") === ["motion", ...path].join("."));
    if (!found) throw new Error(`motion.${path.join(".")}: falta el token`);
    return found.$value;
  };
  const group = (name, parse) =>
    Object.fromEntries(
      tokens
        .filter((t) => t.path[1] === name)
        .map((t) => [t.path[2], parse(t.$value, `motion.${name}.${t.path[2]}`)]),
    );
  return {
    ease: group("ease", (v) => [...v]),
    duration: group("duration", ms),
    distance: group("distance", px),
    stagger: { interval: ms(get("stagger", "interval"), "stagger"), max: Number(get("stagger", "max")) },
    spring: group("spring", (v) => ({ stiffness: Number(v.stiffness), damping: Number(v.damping) })),
    interaction: {
      pressScale: Number(get("interaction", "press-scale")),
      hoverScale: Number(get("interaction", "hover-scale")),
      hoverLift: px(get("interaction", "hover-lift"), "hover-lift"),
    },
    viewport: { amount: Number(get("viewport", "amount")) },
  };
}

export function buildModel(allTokens) {
  const under = (root) => allTokens.filter((t) => t.path[0] === root);
  const fontTokens = under("font");
  const fonts = Object.fromEntries(fontTokens.filter((t) => t.path[1] === "family").map((t) => [t.path[2], [...t.$value]]));
  const weights = Object.fromEntries(fontTokens.filter((t) => t.path[1] === "weight").map((t) => [t.path[2], Number(t.$value)]));
  const hasMotion = under("motion").length > 0;
  return {
    colors: buildColors(under("color")),
    fonts,
    weights,
    text: buildText(under("text")),
    spacing: buildSpacing(under("spacing")),
    containers: buildContainers(under("container")),
    radii: under("radius").map((t) => ({ name: leaf(t), px: px(t.$value, leaf(t)) })),
    shadows: buildShadows(under("shadow")),
    z: under("z").map((t) => ({ name: leaf(t), value: Number(t.$value) })),
    motion: hasMotion ? buildMotion(under("motion")) : null,
  };
}
