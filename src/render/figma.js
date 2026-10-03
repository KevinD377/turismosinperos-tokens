import { figmaColor } from "../lib/color.js";

const round2 = (n) => Math.round(n * 100) / 100;

function colorVariable(c) {
  const base = { name: `color/${c.name}`, type: "COLOR" };
  const values = { Default: figmaColor(c) };
  if (c.tier === "primitive") return { ...base, values };
  return { ...base, aliasOf: c.alpha === 1 ? `color/${c.ref}` : null, values };
}

function responsiveVariables(model) {
  const vars = [];
  for (const t of model.text) {
    vars.push({ name: `text/${t.name}/size`, type: "FLOAT", values: { Mobile: t.size.mobile, Desktop: t.size.desktop } });
    vars.push({
      name: `text/${t.name}/line-height`,
      type: "FLOAT",
      values: { Mobile: Math.round(t.size.mobile * t.lineHeight), Desktop: Math.round(t.size.desktop * t.lineHeight) },
    });
  }
  for (const s of model.spacing) {
    vars.push({ name: `spacing/${s.name}`, type: "FLOAT", values: { Mobile: s.mobile, Desktop: s.desktop } });
  }
  return vars;
}

export function renderFigma(model, version) {
  const doc = {
    version,
    collections: [
      { name: "Primitivos", modes: ["Default"], variables: model.colors.filter((c) => c.tier === "primitive").map(colorVariable) },
      { name: "Semánticos", modes: ["Default"], variables: model.colors.filter((c) => c.tier === "semantic").map(colorVariable) },
      { name: "Responsive", modes: ["Mobile", "Desktop"], variables: responsiveVariables(model) },
      {
        name: "Forma",
        modes: ["Default"],
        variables: [
          ...model.radii.map((r) => ({ name: `radius/${r.name}`, type: "FLOAT", values: { Default: r.px } })),
          ...model.containers
            .filter((c) => c.px !== null)
            .map((c) => ({ name: `container/${c.name}`, type: "FLOAT", values: { Default: c.px } })),
        ],
      },
    ],
    textStyles: model.text.map((t) => ({
      name: t.name,
      fontFamily: model.fonts[t.family][0],
      fontWeight: t.weight,
      textTransform: t.transform ?? "none",
      letterSpacingPercent: round2(t.letterSpacingEm * 100),
      sizeVariable: `text/${t.name}/size`,
      lineHeightVariable: `text/${t.name}/line-height`,
    })),
    effectStyles: model.shadows.map((s) => ({
      name: `shadow/${s.name}`,
      type: "DROP_SHADOW",
      color: figmaColor(s),
      offset: { x: s.offsetX, y: s.offsetY },
      radius: s.blur,
      spread: s.spread,
    })),
  };
  return `${JSON.stringify(doc, null, 2)}\n`;
}
