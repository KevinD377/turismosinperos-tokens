# Paquete `@turismosinperos/tokens` v0.1.0 — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** un repo que guarda los tokens de diseño de TurismoSinPeros en JSON DTCG y genera cuatro salidas
commiteadas en `dist/`: `tokens.css` (Tailwind v4), `tokens.js` + `tokens.d.ts` (React Native y JS) y
`tokens.figma.json`.

**Architecture:** Style Dictionary solo parsea el DTCG y resuelve referencias (y falla ante referencias rotas).
El resultado se normaliza en un **modelo** (objeto JS plano, validado). Cada salida es una función pura
`render*(model) → string`. Así cada formato se testea sin Style Dictionary y las reglas de la marca (alfa
solo sobre primitivos, piso de 11 px, semánticos solo por referencia) viven en un único lugar: el modelo.

**Tech Stack:** Node ≥ 22, ESM puro (`"type": "module"`), JavaScript (sin TS en el código fuente), Style
Dictionary ^5, Vitest ^3, `tailwindcss` ^4.3 + `@tailwindcss/node` ^4.3 (solo para el test de integración).

**Spec:** `docs/specs/2026-10-03-sistema-de-diseno-definicion.md` (leer §3–§9 antes de empezar).

## Global Constraints

- Repo: `C:/dev/turismosinperos-tokens`, rama `main`. Nombre npm: `@turismosinperos/tokens`. Versión `0.1.0`.
- Se consume como dependencia git (`github:kevind377/turismosinperos-tokens#v0.1.0`): **`dist/` se commitea**, no hay script `prepare`.
- Fin de línea LF en todo (ya existe `.gitattributes` con `* text=auto eol=lf`). Las salidas usan `"\n"`.
- Primitivos de color (exactos): cherry-950 `#26141A`, cherry-900 `#180B10`, rosewood-400 `#AA6B76`, rosewood-600 `#8C4F5A`, olive-500 `#847225`, olive-600 `#6B5C1E`, bone-200 `#DBCCB5`, humo `#F2F4F3`, white `#FFFFFF`, black `#000000`. No se agrega ningún otro hex.
- Un color semántico **siempre** es una referencia a otro color. El alfa (`$extensions["com.turismosinperos"].alpha`) solo se permite sobre una referencia a un **primitivo**.
- Piso tipográfico: 11 px.
- Fluido: viewport 375 px → 1280 px, fórmula de §5.2 del spec; los strings resultantes deben coincidir carácter por carácter con los del spec.
- Breakpoint desktop para `nav-height`: `64rem` (el `lg` de Tailwind).
- Velos y sombras: negros.
- No crear el repo en GitHub, no hacer push y no taggear: eso lo hace Claude después de auditar.
- No usar `any` ni dependencias fuera de las listadas.

## Review Focus

1. **Archivos generados con CRLF en Windows** → el `dist` del CI no coincide con el commiteado y el check de CI falla siempre. Esperado: las salidas no contienen `\r`. Test en Task 6, 7 y 8.
2. **Instalación por git sin build** → si `dist/` falta o `exports` apunta a un archivo que no existe, la web y la app rompen al importar. Esperado: cada ruta de `exports` existe. Test en Task 9.
3. **Sobrescritura de defaults de Tailwind** (`--radius-sm…xl`, `--shadow-sm…lg`, `--ease-out`, `--ease-in-out`) → cambia en silencio las clases `rounded-lg` y `shadow-md` en sitios sin migrar. Esperado: es intencional, pero el README lo advierte y un test fija los valores. Test en Task 6.
4. **Un semántico con hex crudo o con alfa sobre otro semántico** → color fuera de la paleta o alfa aplicado dos veces. Esperado: el build lanza un error con el nombre del token. Test en Task 4.
5. **Nombre de fuente con espacios sin comillas** (`Work Sans`) → Tailwind genera un `font-family` inválido. Esperado: `--font-sans: "Work Sans", ui-sans-serif, system-ui, sans-serif;`. Test en Task 6.

## File Structure

```
package.json                 metadata, exports, scripts
.gitignore                   node_modules
.github/workflows/ci.yml     test + build + dist sin cambios
README.md                    instalación y uso por plataforma, advertencias, releases
tokens/primitive/color.json  10 primitivos
tokens/primitive/font.json   familias y pesos
tokens/semantic/color.json   roles de color
tokens/semantic/text.json    escala display + texto
tokens/semantic/layout.json  spacing (nav-height, section, gutter) y container
tokens/semantic/shape.json   radius, shadow, z
tokens/semantic/motion.json  curvas, duraciones, distancias, stagger, resortes, interacción, viewport
src/lib/color.js             hex → rgb, alfa, contraste, impresión por plataforma
src/lib/fluid.js             clamp() fluido y rem()
src/lib/names.js             kebab → camel
src/load.js                  Style Dictionary → lista plana de tokens resueltos
src/model.js                 tokens resueltos → Model validado
src/render/css.js            Model → tokens.css
src/render/js.js             Model → { js, dts }
src/render/figma.js          Model → tokens.figma.json
src/build.js                 orquesta y escribe dist/
test/*.test.js               un archivo por unidad
test/fixtures/broken/color.json
dist/                        salidas commiteadas
```

---

### Task 1: Scaffold + utilidades de color

**Files:**
- Create: `package.json`, `.gitignore`, `src/lib/color.js`, `test/color.test.js`

**Interfaces:**
- Produces:
  - `hexToRgb(hex: string): [number, number, number]`. Lanza un error si el string no es `#RRGGBB`.
  - `composite(rgb, alpha: number, bgRgb): [number, number, number]`. Mezcla el color sobre el fondo y redondea cada canal.
  - `contrast(rgbA, rgbB): number`. Ratio WCAG 2.x.
  - `cssColor({ hex, rgb, alpha }): string`. Devuelve `#26141A` si alpha es 1 y `rgb(38 20 26 / 0.7)` si no.
  - `rnColor({ hex, rgb, alpha }): string`. Devuelve `#26141A` si alpha es 1 y `rgba(38, 20, 26, 0.7)` si no.
  - `figmaColor({ rgb, alpha }): { r, g, b, a }`. Canales de 0 a 1 redondeados a 4 decimales.

- [ ] **Step 1: Crear `package.json` y `.gitignore`**

```json
{
  "name": "@turismosinperos/tokens",
  "version": "0.1.0",
  "description": "Tokens de diseño de TurismoSinPeros: fuente DTCG y salidas para Tailwind v4, React Native y Figma.",
  "type": "module",
  "license": "UNLICENSED",
  "engines": { "node": ">=22" },
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/tokens.d.ts", "default": "./dist/tokens.js" },
    "./tokens.css": { "style": "./dist/tokens.css", "default": "./dist/tokens.css" },
    "./figma.json": "./dist/tokens.figma.json",
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "node src/build.js",
    "test": "vitest run"
  },
  "devDependencies": {
    "@tailwindcss/node": "^4.3.3",
    "style-dictionary": "^5.0.0",
    "tailwindcss": "^4.3.3",
    "vitest": "^3.2.0"
  }
}
```

`.gitignore`:

```
node_modules/
```

Run: `npm install`
Expected: se crea `package-lock.json` sin errores.

- [ ] **Step 2: Test que falla**

`test/color.test.js`:

```js
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
```

Run: `npx vitest run test/color.test.js`
Expected: FAIL, "Failed to load url ../src/lib/color.js".

- [ ] **Step 3: Implementación**

`src/lib/color.js`:

```js
const HEX = /^#([0-9a-f]{6})$/i;

export function hexToRgb(hex) {
  const match = HEX.exec(hex);
  if (!match) throw new Error(`Color hex inválido: ${hex}`);
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function composite(rgb, alpha, bgRgb) {
  return rgb.map((channel, i) => Math.round(channel * alpha + bgRgb[i] * (1 - alpha)));
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(rgbA, rgbB) {
  const a = luminance(rgbA);
  const b = luminance(rgbB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function cssColor({ hex, rgb, alpha }) {
  return alpha === 1 ? hex : `rgb(${rgb.join(" ")} / ${alpha})`;
}

export function rnColor({ hex, rgb, alpha }) {
  return alpha === 1 ? hex : `rgba(${rgb.join(", ")}, ${alpha})`;
}

const round4 = (n) => Math.round(n * 10000) / 10000;

export function figmaColor({ rgb, alpha }) {
  const [r, g, b] = rgb.map((channel) => round4(channel / 255));
  return { r, g, b, a: alpha };
}
```

- [ ] **Step 4: Verificar**

Run: `npx vitest run test/color.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore src/lib/color.js test/color.test.js
git commit -m "feat: scaffold del paquete y utilidades de color"
```

---

### Task 2: Utilidades `fluid`, `rem` y `camel`

**Files:**
- Create: `src/lib/fluid.js`, `src/lib/names.js`, `test/fluid.test.js`

**Interfaces:**
- Produces:
  - `FLUID_MIN_VW = 375`, `FLUID_MAX_VW = 1280`.
  - `rem(px: number): string`. Ejemplos: `44 → "2.75rem"`, `16 → "1rem"`.
  - `fluid(minPx: number, maxPx: number): string`. Devuelve un `clamp(...)`.
  - `camel(kebab: string): string`. Ejemplos: `"fg-secondary" → "fgSecondary"`, `"cherry-950" → "cherry950"`, `"in-out" → "inOut"`.

- [ ] **Step 1: Test que falla**

`test/fluid.test.js`:

```js
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
```

Run: `npx vitest run test/fluid.test.js`
Expected: FAIL (no se puede cargar el módulo).

- [ ] **Step 2: Implementación**

`src/lib/fluid.js`:

```js
export const FLUID_MIN_VW = 375;
export const FLUID_MAX_VW = 1280;

export function rem(px) {
  return `${Number((px / 16).toFixed(4))}rem`;
}

export function fluid(minPx, maxPx) {
  if (minPx > maxPx) throw new Error(`fluid: min (${minPx}) mayor que max (${maxPx})`);
  const slope = (maxPx - minPx) / (FLUID_MAX_VW - FLUID_MIN_VW);
  const intercept = minPx - FLUID_MIN_VW * slope;
  return `clamp(${rem(minPx)}, ${(intercept / 16).toFixed(3)}rem + ${(slope * 100).toFixed(3)}vw, ${rem(maxPx)})`;
}
```

`src/lib/names.js`:

```js
export function camel(kebab) {
  return kebab.replace(/-([a-z0-9])/g, (_, next) => next.toUpperCase());
}
```

- [ ] **Step 3: Verificar**

Run: `npx vitest run test/fluid.test.js`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/fluid.js src/lib/names.js test/fluid.test.js
git commit -m "feat: clamp fluido, rem y camelCase"
```

---

### Task 3: Fuente DTCG de tokens

**Files:**
- Create: los 7 archivos de `tokens/` (contenido completo abajo)

**Interfaces:**
- Produces: árbol DTCG con raíces `color`, `font`, `text`, `spacing`, `container`, `radius`, `shadow`, `z` y `motion`. La extensión propia es `$extensions["com.turismosinperos"]` con las claves `alpha`, `fluidMax`, `desktop` y `textTransform`.

- [ ] **Step 1: `tokens/primitive/color.json`**

```json
{
  "color": {
    "$type": "color",
    "cherry-950": { "$value": "#26141A", "$description": "Texto principal, botón primario" },
    "cherry-900": { "$value": "#180B10", "$description": "Hover del botón primario" },
    "rosewood-400": { "$value": "#AA6B76", "$description": "Relleno, ícono o texto ≥24 px. Nunca texto chico (3.75 sobre humo)" },
    "rosewood-600": { "$value": "#8C4F5A", "$description": "Acento de texto, foco" },
    "olive-500": { "$value": "#847225", "$description": "Relleno, ícono o texto ≥24 px. Nunca texto chico (4.31 sobre humo)" },
    "olive-600": { "$value": "#6B5C1E", "$description": "Texto positivo, hover secundario" },
    "bone-200": { "$value": "#DBCCB5", "$description": "Bordes, superficie cálida, acento sobre oscuro" },
    "humo": { "$value": "#F2F4F3", "$description": "Fondo de página" },
    "white": { "$value": "#FFFFFF", "$description": "Superficie de tarjeta" },
    "black": { "$value": "#000000", "$description": "Solo velos y sombras" }
  }
}
```

- [ ] **Step 2: `tokens/primitive/font.json`**

```json
{
  "font": {
    "family": {
      "$type": "fontFamily",
      "sans": { "$value": ["Work Sans", "ui-sans-serif", "system-ui", "sans-serif"] },
      "display": { "$value": ["Marcellus", "ui-serif", "Georgia", "serif"] }
    },
    "weight": {
      "$type": "fontWeight",
      "regular": { "$value": 400 },
      "semibold": { "$value": 600 },
      "bold": { "$value": 700 }
    }
  }
}
```

- [ ] **Step 3: `tokens/semantic/color.json`**

```json
{
  "color": {
    "$type": "color",
    "fg": { "$value": "{color.cherry-950}" },
    "fg-secondary": { "$value": "{color.cherry-950}", "$extensions": { "com.turismosinperos": { "alpha": 0.7 } } },
    "fg-disabled": { "$value": "{color.cherry-950}", "$extensions": { "com.turismosinperos": { "alpha": 0.4 } } },
    "fg-accent": { "$value": "{color.rosewood-600}" },
    "fg-positive": { "$value": "{color.olive-600}" },
    "fg-inverse": { "$value": "{color.humo}" },
    "fg-inverse-secondary": { "$value": "{color.humo}", "$extensions": { "com.turismosinperos": { "alpha": 0.75 } } },
    "fg-inverse-accent": { "$value": "{color.bone-200}" },

    "surface": { "$value": "{color.humo}" },
    "surface-raised": { "$value": "{color.white}" },
    "surface-muted": { "$value": "{color.bone-200}" },
    "surface-inverse": { "$value": "{color.cherry-950}" },
    "surface-accent-subtle": { "$value": "{color.rosewood-400}", "$extensions": { "com.turismosinperos": { "alpha": 0.1 } } },
    "surface-positive-subtle": { "$value": "{color.olive-500}", "$extensions": { "com.turismosinperos": { "alpha": 0.12 } } },

    "line": { "$value": "{color.bone-200}" },
    "line-subtle": { "$value": "{color.cherry-950}", "$extensions": { "com.turismosinperos": { "alpha": 0.1 } } },
    "line-strong": { "$value": "{color.cherry-950}", "$extensions": { "com.turismosinperos": { "alpha": 0.25 } } },
    "line-inverse": { "$value": "{color.humo}", "$extensions": { "com.turismosinperos": { "alpha": 0.3 } } },

    "action-primary": { "$value": "{color.cherry-950}" },
    "action-primary-hover": { "$value": "{color.cherry-900}" },
    "action-primary-fg": { "$value": "{color.humo}" },
    "action-secondary": { "$value": "{color.olive-500}" },
    "action-secondary-hover": { "$value": "{color.olive-600}" },
    "action-secondary-fg": { "$value": "{color.white}" },
    "action-accent": { "$value": "{color.rosewood-600}" },
    "action-accent-hover": { "$value": "{color.cherry-950}" },
    "action-accent-fg": { "$value": "{color.white}" },

    "focus": { "$value": "{color.rosewood-600}" },
    "focus-inverse": { "$value": "{color.bone-200}" },

    "scrim-soft": { "$value": "{color.black}", "$extensions": { "com.turismosinperos": { "alpha": 0.4 } } },
    "scrim-medium": { "$value": "{color.black}", "$extensions": { "com.turismosinperos": { "alpha": 0.55 } } },
    "scrim-strong": { "$value": "{color.black}", "$extensions": { "com.turismosinperos": { "alpha": 0.8 } } }
  }
}
```

- [ ] **Step 4: `tokens/semantic/text.json`**

`fontSize` es el valor móvil. `fluidMax` (si existe) es el valor desktop y vuelve fluido al token.

```json
{
  "text": {
    "$type": "typography",
    "display-xl": {
      "$value": { "fontFamily": "{font.family.display}", "fontWeight": "{font.weight.regular}", "fontSize": "44px", "lineHeight": 1.1, "letterSpacing": "-0.02em" },
      "$extensions": { "com.turismosinperos": { "fluidMax": "64px" } }
    },
    "display-lg": {
      "$value": { "fontFamily": "{font.family.display}", "fontWeight": "{font.weight.regular}", "fontSize": "32px", "lineHeight": 1.1, "letterSpacing": "-0.02em" },
      "$extensions": { "com.turismosinperos": { "fluidMax": "48px" } }
    },
    "display-md": {
      "$value": { "fontFamily": "{font.family.display}", "fontWeight": "{font.weight.regular}", "fontSize": "24px", "lineHeight": 1.15, "letterSpacing": "-0.02em" },
      "$extensions": { "com.turismosinperos": { "fluidMax": "32px" } }
    },
    "display-sm": {
      "$value": { "fontFamily": "{font.family.display}", "fontWeight": "{font.weight.regular}", "fontSize": "20px", "lineHeight": 1.2, "letterSpacing": "-0.01em" },
      "$extensions": { "com.turismosinperos": { "fluidMax": "24px" } }
    },
    "body-lg": {
      "$value": { "fontFamily": "{font.family.sans}", "fontWeight": "{font.weight.regular}", "fontSize": "18px", "lineHeight": 1.6, "letterSpacing": "0em" }
    },
    "body": {
      "$value": { "fontFamily": "{font.family.sans}", "fontWeight": "{font.weight.regular}", "fontSize": "16px", "lineHeight": 1.6, "letterSpacing": "0em" }
    },
    "body-sm": {
      "$value": { "fontFamily": "{font.family.sans}", "fontWeight": "{font.weight.regular}", "fontSize": "14px", "lineHeight": 1.5, "letterSpacing": "0em" }
    },
    "caption": {
      "$value": { "fontFamily": "{font.family.sans}", "fontWeight": "{font.weight.regular}", "fontSize": "12px", "lineHeight": 1.4, "letterSpacing": "0em" }
    },
    "overline": {
      "$value": { "fontFamily": "{font.family.sans}", "fontWeight": "{font.weight.semibold}", "fontSize": "11px", "lineHeight": 1.3, "letterSpacing": "0.16em" },
      "$extensions": { "com.turismosinperos": { "textTransform": "uppercase" } }
    }
  }
}
```

- [ ] **Step 5: `tokens/semantic/layout.json`**

```json
{
  "spacing": {
    "$type": "dimension",
    "nav-height": {
      "$value": "84px",
      "$description": "Alto de la navbar fija. 84 en móvil, 76 desde 64rem",
      "$extensions": { "com.turismosinperos": { "desktop": "76px" } }
    },
    "section": {
      "$value": "64px",
      "$description": "Padding vertical de sección, fluido",
      "$extensions": { "com.turismosinperos": { "fluidMax": "128px" } }
    },
    "gutter": {
      "$value": "16px",
      "$description": "Padding horizontal de página, fluido",
      "$extensions": { "com.turismosinperos": { "fluidMax": "80px" } }
    }
  },
  "container": {
    "$type": "dimension",
    "prose": { "$value": "672px" },
    "content": { "$value": "1152px" },
    "wide": { "$value": "1280px" },
    "measure": { "$value": "65ch", "$description": "Ancho máximo de párrafo. Solo CSS" }
  }
}
```

- [ ] **Step 6: `tokens/semantic/shape.json`**

```json
{
  "radius": {
    "$type": "dimension",
    "sm": { "$value": "8px" },
    "md": { "$value": "12px" },
    "lg": { "$value": "16px" },
    "xl": { "$value": "28px" },
    "full": { "$value": "9999px" }
  },
  "shadow": {
    "$type": "shadow",
    "sm": {
      "$value": { "color": "{color.black}", "offsetX": "0px", "offsetY": "2px", "blur": "8px", "spread": "0px" },
      "$extensions": { "com.turismosinperos": { "alpha": 0.05 } }
    },
    "md": {
      "$value": { "color": "{color.black}", "offsetX": "0px", "offsetY": "8px", "blur": "24px", "spread": "0px" },
      "$extensions": { "com.turismosinperos": { "alpha": 0.1 } }
    },
    "lg": {
      "$value": { "color": "{color.black}", "offsetX": "0px", "offsetY": "16px", "blur": "40px", "spread": "0px" },
      "$extensions": { "com.turismosinperos": { "alpha": 0.14 } }
    }
  },
  "z": {
    "$type": "number",
    "base": { "$value": 0 },
    "sticky": { "$value": 10 },
    "nav": { "$value": 40 },
    "overlay": { "$value": 50 },
    "modal": { "$value": 60 },
    "toast": { "$value": 70 }
  }
}
```

- [ ] **Step 7: `tokens/semantic/motion.json`**

```json
{
  "motion": {
    "ease": {
      "$type": "cubicBezier",
      "out": { "$value": [0.22, 1, 0.36, 1], "$description": "Todo lo que entra o aparece" },
      "in-out": { "$value": [0.65, 0, 0.35, 1], "$description": "Desplazamientos dentro de la pantalla" }
    },
    "duration": {
      "$type": "duration",
      "instant": { "$value": "150ms" },
      "fast": { "$value": "250ms" },
      "base": { "$value": "400ms" },
      "slow": { "$value": "600ms" },
      "slower": { "$value": "900ms" }
    },
    "distance": {
      "$type": "dimension",
      "sm": { "$value": "8px" },
      "md": { "$value": "16px" },
      "lg": { "$value": "24px" }
    },
    "stagger": {
      "interval": { "$type": "duration", "$value": "70ms" },
      "max": { "$type": "number", "$value": 6 }
    },
    "spring": {
      "$type": "spring",
      "snappy": { "$value": { "stiffness": 500, "damping": 32 } },
      "gentle": { "$value": { "stiffness": 260, "damping": 25 } }
    },
    "interaction": {
      "press-scale": { "$type": "number", "$value": 0.98 },
      "hover-scale": { "$type": "number", "$value": 1.04 },
      "hover-lift": { "$type": "dimension", "$value": "-2px" }
    },
    "viewport": {
      "amount": { "$type": "number", "$value": 0.2 }
    }
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add tokens
git commit -m "feat: fuente DTCG de tokens (color, tipografía, layout, forma, motion)"
```

---

### Task 4: Carga con Style Dictionary y modelo validado

**Files:**
- Create: `src/load.js`, `src/model.js`, `test/model.test.js`, `test/fixtures/broken/color.json`

**Interfaces:**
- Consumes: `hexToRgb` (Task 1).
- Produces:
  - `loadTokens(source?: string[]): Promise<Token[]>`. `source` por defecto: `["tokens/**/*.json"]`, resuelto desde la raíz del repo. Cada `Token` tiene `path: string[]`, `$value` (resuelto), `$type`, `$extensions?`, `original: { $value }` y `filePath: string`.
  - `buildModel(tokens: Token[]): Model`. Valida y lanza `Error` con el nombre del token si algo no cumple.
  - Forma de `Model` (las Tasks 5–8 dependen de estos nombres exactos):

```js
{
  colors: [{ name: "fg-secondary", tier: "semantic", hex: "#26141A", rgb: [38, 20, 26], alpha: 0.7, ref: "cherry-950" }],
  // tier: "primitive" | "semantic"; ref: null en primitivos
  fonts: { sans: ["Work Sans", "ui-sans-serif", "system-ui", "sans-serif"], display: [...] },
  weights: { regular: 400, semibold: 600, bold: 700 },
  text: [{ name: "display-xl", family: "display", weight: 400, size: { mobile: 44, desktop: 64 }, fluid: true,
           lineHeight: 1.1, letterSpacingEm: -0.02, transform: null }],   // transform: null | "uppercase"
  spacing: [{ name: "nav-height", kind: "responsive", mobile: 84, desktop: 76 },
            { name: "section", kind: "fluid", mobile: 64, desktop: 128 }],
  containers: [{ name: "prose", px: 672, css: "42rem" }, { name: "measure", px: null, css: "65ch" }],
  radii: [{ name: "sm", px: 8 }],
  shadows: [{ name: "sm", offsetX: 0, offsetY: 2, blur: 8, spread: 0, rgb: [0, 0, 0], alpha: 0.05 }],
  z: [{ name: "nav", value: 40 }],
  motion: {
    ease: { out: [0.22, 1, 0.36, 1], "in-out": [0.65, 0, 0.35, 1] },
    duration: { instant: 150, fast: 250, base: 400, slow: 600, slower: 900 },   // ms
    distance: { sm: 8, md: 16, lg: 24 },                                       // px
    stagger: { interval: 70, max: 6 },
    spring: { snappy: { stiffness: 500, damping: 32 }, gentle: { stiffness: 260, damping: 25 } },
    interaction: { pressScale: 0.98, hoverScale: 1.04, hoverLift: -2 },
    viewport: { amount: 0.2 }
  }
}
```

- [ ] **Step 1: Fixture de referencia rota**

`test/fixtures/broken/color.json`:

```json
{ "color": { "$type": "color", "roto": { "$value": "{color.no-existe}" } } }
```

- [ ] **Step 2: Test que falla**

`test/model.test.js`:

```js
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
```

Run: `npx vitest run test/model.test.js`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: `src/load.js`**

Style Dictionary 5 expone `getPlatformTokens(platform)`, que devuelve `{ tokens, allTokens }` con las referencias resueltas. Confirmalo en `node_modules/style-dictionary/README.md` o en `docs/`. Si en la versión instalada el método se llama distinto, usá el equivalente que devuelva la lista plana de tokens resueltos y dejá una nota en el commit.

```js
import path from "node:path";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function loadTokens(source = ["tokens/**/*.json"]) {
  const sd = new StyleDictionary({
    source: source.map((glob) => path.posix.join(ROOT.replaceAll("\\", "/"), glob)),
    usesDtcg: true,
    log: { verbosity: "silent", warnings: "disabled", errors: { brokenReferences: "throw" } },
    platforms: { model: { transforms: [] } },
  });
  const { allTokens } = await sd.getPlatformTokens("model");
  return allTokens;
}
```

- [ ] **Step 4: `src/model.js`**

```js
import { hexToRgb } from "./lib/color.js";
import { rem } from "./lib/fluid.js";

const EXT = "com.turismosinperos";
const MIN_TEXT_PX = 11;

const ext = (t) => t.$extensions?.[EXT] ?? {};
const leaf = (t, depth = 1) => t.path.slice(depth).join("-");
const isRef = (value) => typeof value === "string" && value.startsWith("{") && value.endsWith("}");
const refName = (value) => value.slice(1, -1).split(".").slice(1).join("-");

function parseUnit(value, unit, label) {
  const match = new RegExp(`^(-?\\d+(?:\\.\\d+)?)${unit}$`).exec(String(value));
  if (!match) throw new Error(`${label}: se esperaba un valor en ${unit}, llegó "${value}"`);
  return Number(match[1]);
}
const px = (value, label) => parseUnit(value, "px", label);
const ms = (value, label) => parseUnit(value, "ms", label);
const em = (value, label) => parseUnit(value, "em", label);

function buildColors(tokens) {
  const isPrimitive = (t) => t.filePath.replaceAll("\\", "/").includes("/primitive/");
  const primitives = new Set(tokens.filter(isPrimitive).map((t) => leaf(t)));
  return tokens.map((t) => {
    const name = leaf(t);
    const alpha = ext(t).alpha ?? 1;
    if (isPrimitive(t)) {
      if (alpha !== 1) throw new Error(`${name}: un primitivo no lleva alfa`);
      return { name, tier: "primitive", hex: t.$value.toUpperCase(), rgb: hexToRgb(t.$value), alpha, ref: null };
    }
    const original = t.original.$value;
    if (!isRef(original)) throw new Error(`${name}: un semántico debe ser una referencia, no "${original}"`);
    const ref = refName(original);
    if (alpha !== 1 && !primitives.has(ref)) {
      throw new Error(`${name}: el alfa solo se aplica sobre un primitivo, no sobre "${ref}"`);
    }
    return { name, tier: "semantic", hex: t.$value.toUpperCase(), rgb: hexToRgb(t.$value), alpha, ref };
  });
}

function buildText(tokens) {
  return tokens.map((t) => {
    const name = leaf(t);
    const v = t.$value;
    const mobile = px(v.fontSize, name);
    const fluidMax = ext(t).fluidMax;
    const desktop = fluidMax ? px(fluidMax, name) : mobile;
    if (mobile < MIN_TEXT_PX) throw new Error(`${name}: ${mobile}px está bajo el piso de ${MIN_TEXT_PX}px`);
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
    return {
      name,
      offsetX: px(v.offsetX, name),
      offsetY: px(v.offsetY, name),
      blur: px(v.blur, name),
      spread: px(v.spread, name),
      rgb: hexToRgb(v.color),
      alpha: ext(t).alpha ?? 1,
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
```

Nota: el test de "texto bajo 11 px" pasa un `fontFamily` original `{font.family.sans}`. `refName` devuelve `family-sans` y se recorta a `sans`. El test de piso tiene que fallar **antes** de esa línea, porque el chequeo de tamaño ocurre primero.

- [ ] **Step 5: Verificar**

Run: `npx vitest run test/model.test.js`
Expected: PASS. Si `getPlatformTokens` no existe, ajustá `load.js` según la nota del Step 3 hasta que pase.

- [ ] **Step 6: Commit**

```bash
git add src/load.js src/model.js test/model.test.js test/fixtures
git commit -m "feat: carga DTCG con Style Dictionary y modelo validado"
```

---

### Task 5: Garantía de contraste WCAG

**Files:**
- Create: `test/contrast.test.js`

**Interfaces:**
- Consumes: `loadTokens`, `buildModel` (Task 4); `composite`, `contrast` (Task 1).

- [ ] **Step 1: Test**

```js
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
```

- [ ] **Step 2: Verificar**

Run: `npx vitest run test/contrast.test.js`
Expected: PASS (22 casos). Si alguno falla, **no cambies el token**: es una contradicción con el spec. Detenete y reportalo.

- [ ] **Step 3: Commit**

```bash
git add test/contrast.test.js
git commit -m "test: contraste WCAG de todos los pares texto/fondo del sistema"
```

---

### Task 6: Salida CSS para Tailwind v4

**Files:**
- Create: `src/render/css.js`, `test/css.test.js`

**Interfaces:**
- Consumes: `Model` (Task 4), `cssColor` (Task 1), `fluid` y `rem` (Task 2).
- Produces: `renderCss(model, version: string): string`.

Estructura exacta de la salida:

```css
/* @turismosinperos/tokens v0.1.0 — generado, no editar a mano */
@theme {
  --color-<name>: <cssColor>;          /* todos los colores, primitivos primero */
  --font-sans: "Work Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Marcellus", ui-serif, "Georgia", serif;
  --text-<name>: <fluid(min,max) si fluid, si no rem(px)>;
  --text-<name>--line-height: <lineHeight>;
  --text-<name>--letter-spacing: <n>em;      /* solo si ≠ 0 */
  --text-<name>--font-weight: <weight>;      /* solo si ≠ 400 */
  --spacing-<name>: <fluid(...)>;            /* solo kind "fluid" */
  --container-<name>: <css>;
  --radius-<name>: <rem(px)>;                /* full → 9999px */
  --shadow-<name>: <x>px <y>px <blur>px <spread>px rgb(0 0 0 / <alpha>);   /* 0px se escribe 0 */
  --ease-<name>: cubic-bezier(a, b, c, d);
}

@theme inline {
  --spacing-<name>: var(--<name>);           /* solo kind "responsive" */
}

:root {
  --<name>: <mobile>px;                      /* kind "responsive" */
  --duration-<name>: <ms>ms;
  --z-<name>: <value>;
}

@media (min-width: 64rem) {
  :root {
    --<name>: <desktop>px;                   /* kind "responsive" */
  }
}
```

Regla de comillas en las familias: van entre comillas todas, salvo los genéricos `ui-sans-serif`, `ui-serif`, `system-ui`, `sans-serif` y `serif`.

- [ ] **Step 1: Test que falla**

```js
import { compile } from "@tailwindcss/node";
import { describe, expect, it } from "vitest";
import { loadTokens } from "../src/load.js";
import { buildModel } from "../src/model.js";
import { renderCss } from "../src/render/css.js";

const css = renderCss(buildModel(await loadTokens()), "0.1.0");

describe("tokens.css", () => {
  it.each([
    "--color-cherry-950: #26141A;",
    "--color-fg-secondary: rgb(38 20 26 / 0.7);",
    "--color-scrim-medium: rgb(0 0 0 / 0.55);",
    '--font-sans: "Work Sans", ui-sans-serif, system-ui, sans-serif;',
    '--font-display: "Marcellus", ui-serif, "Georgia", serif;',
    "--text-display-xl: clamp(2.75rem, 2.232rem + 2.210vw, 4rem);",
    "--text-display-xl--line-height: 1.1;",
    "--text-display-xl--letter-spacing: -0.02em;",
    "--text-body-sm: 0.875rem;",
    "--text-overline--font-weight: 600;",
    "--text-overline--letter-spacing: 0.16em;",
    "--spacing-section: clamp(4rem, 2.343rem + 7.072vw, 8rem);",
    "--spacing-gutter: clamp(1rem, -0.657rem + 7.072vw, 5rem);",
    "--spacing-nav-height: var(--nav-height);",
    "--nav-height: 84px;",
    "--nav-height: 76px;",
    "--container-prose: 42rem;",
    "--container-measure: 65ch;",
    "--radius-lg: 1rem;",
    "--radius-full: 9999px;",
    "--shadow-md: 0 8px 24px 0 rgb(0 0 0 / 0.1);",
    "--ease-out: cubic-bezier(0.22, 1, 0.36, 1);",
    "--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);",
    "--duration-slow: 600ms;",
    "--z-modal: 60;",
  ])("contiene %s", (line) => {
    expect(css).toContain(line);
  });

  it("sin CRLF ni declaraciones redundantes en body", () => {
    expect(css).not.toContain("\r");
    expect(css).not.toContain("--text-body--letter-spacing");
    expect(css).not.toContain("--text-body--font-weight");
  });

  it("Tailwind v4 genera las utilidades esperadas", async () => {
    const compiler = await compile(`@import "tailwindcss";\n${css}`, {
      base: process.cwd(),
      onDependency: () => {},
    });
    const out = compiler.build([
      "text-fg-secondary", "bg-surface-raised", "border-line", "text-display-xl", "font-display",
      "pt-nav-height", "py-section", "px-gutter", "max-w-content", "rounded-lg", "shadow-md", "ease-out",
    ]);
    for (const cls of ["text-fg-secondary", "bg-surface-raised", "border-line", "text-display-xl", "font-display",
      "pt-nav-height", "py-section", "px-gutter", "max-w-content", "rounded-lg", "shadow-md", "ease-out"]) {
      expect(out, cls).toContain(`.${cls}`);
    }
  });
});
```

Run: `npx vitest run test/css.test.js`
Expected: FAIL (no existe `render/css.js`).

- [ ] **Step 2: Implementación**

`src/render/css.js`:

```js
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
```

- [ ] **Step 3: Verificar**

Run: `npx vitest run test/css.test.js`
Expected: PASS. Si `compile` de `@tailwindcss/node` pide otra firma en la versión instalada, ajustá solo el test de integración según su `README` o sus tipos `.d.ts`, sin tocar `renderCss`.

- [ ] **Step 4: Commit**

```bash
git add src/render/css.js test/css.test.js
git commit -m "feat: salida tokens.css para Tailwind v4"
```

---

### Task 7: Salida JS y tipos para React Native

**Files:**
- Create: `src/render/js.js`, `test/js.test.js`

**Interfaces:**
- Consumes: `Model`, `rnColor` (Task 1), `camel` (Task 2).
- Produces: `renderJs(model, version): { js: string, dts: string }`. Exports nombrados: `color`, `font`, `text`, `spacing`, `container`, `radius`, `shadow`, `z` y `motion`, más `tokens`, que los agrupa.

Valores (todas las claves en camelCase):

- `color.fgSecondary`: `"rgba(38, 20, 26, 0.7)"`. `color.cherry950`: `"#26141A"`.
- `font`: `{ family: { sans: "Work Sans", display: "Marcellus" }, weight: { regular: 400, semibold: 600, bold: 700 } }`. Lleva solo el primer nombre de cada familia.
- `text.displayXl`: `{ fontFamily: "Marcellus", fontWeight: 400, textTransform: "none", mobile: { fontSize: 44, lineHeight: 48, letterSpacing: -0.88 }, desktop: { fontSize: 64, lineHeight: 70, letterSpacing: -1.28 } }`, con `lineHeight = Math.round(size * ratio)` y `letterSpacing = round2(size * em)`.
- `spacing.navHeight`: `{ mobile: 84, desktop: 76 }`.
- `container`: solo los que tienen `px` (`prose`, `content`, `wide`). `measure` no va, porque React Native no tiene `ch`.
- `radius.lg`: `16`.
- `shadow.md`: `{ color: "rgba(0, 0, 0, 0.1)", offsetX: 0, offsetY: 8, blur: 24, spread: 0 }`.
- `z.nav`: `40`.
- `motion`: igual que `model.motion`, pero con claves camelCase (`ease.inOut`). Las duraciones van en **ms**.

`dts`: `export declare const <grupo>: <JSON del grupo>;` para cada grupo (un literal JSON es un tipo TS válido), más `export declare const tokens: { color: typeof color; … };`.

- [ ] **Step 1: Test que falla**

```js
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
```

Run: `npx vitest run test/js.test.js`
Expected: FAIL.

- [ ] **Step 2: Implementación**

`src/render/js.js`:

```js
import { rnColor } from "../lib/color.js";
import { camel } from "../lib/names.js";

const round2 = (n) => Math.round(n * 100) / 100;
const camelKeys = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [camel(k), v]));

function textMode(size, t) {
  return { fontSize: size, lineHeight: Math.round(size * t.lineHeight), letterSpacing: round2(size * t.letterSpacingEm) };
}

function groups(model) {
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
```

Nota: `rnColor` con `alpha < 1` no usa `hex`, así que pasar `hex: ""` para sombras es seguro, porque todas tienen alfa. Si una sombra tuviera `alpha` 1, `rnColor` devolvería `""`. Para que eso no pase en silencio, agregá en `groups` un `throw` cuando `s.alpha === 1`, con el mensaje `sombra <name>: debe tener alfa`.

- [ ] **Step 3: Verificar**

Run: `npx vitest run test/js.test.js`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/render/js.js test/js.test.js
git commit -m "feat: salida tokens.js + tokens.d.ts para React Native"
```

---

### Task 8: Salida Figma

**Files:**
- Create: `src/render/figma.js`, `test/figma.test.js`

**Interfaces:**
- Consumes: `Model`, `figmaColor` (Task 1).
- Produces: `renderFigma(model, version): string` (JSON con 2 espacios y `\n` final). La forma es propia y la consume el subproyecto 5:

```json
{
  "version": "0.1.0",
  "collections": [
    { "name": "Primitivos", "modes": ["Default"], "variables": [
      { "name": "color/cherry-950", "type": "COLOR", "values": { "Default": { "r": 0.149, "g": 0.0784, "b": 0.102, "a": 1 } } } ] },
    { "name": "Semánticos", "modes": ["Default"], "variables": [
      { "name": "color/fg", "type": "COLOR", "aliasOf": "color/cherry-950", "values": { "Default": { "r": 0.149, "g": 0.0784, "b": 0.102, "a": 1 } } },
      { "name": "color/fg-secondary", "type": "COLOR", "aliasOf": null, "values": { "Default": { "r": 0.149, "g": 0.0784, "b": 0.102, "a": 0.7 } } } ] },
    { "name": "Responsive", "modes": ["Mobile", "Desktop"], "variables": [
      { "name": "text/display-xl/size", "type": "FLOAT", "values": { "Mobile": 44, "Desktop": 64 } },
      { "name": "text/display-xl/line-height", "type": "FLOAT", "values": { "Mobile": 48, "Desktop": 70 } },
      { "name": "spacing/nav-height", "type": "FLOAT", "values": { "Mobile": 84, "Desktop": 76 } } ] },
    { "name": "Forma", "modes": ["Default"], "variables": [
      { "name": "radius/lg", "type": "FLOAT", "values": { "Default": 16 } },
      { "name": "container/prose", "type": "FLOAT", "values": { "Default": 672 } } ] }
  ],
  "textStyles": [
    { "name": "display-xl", "fontFamily": "Marcellus", "fontWeight": 400, "textTransform": "none",
      "letterSpacingPercent": -2, "sizeVariable": "text/display-xl/size", "lineHeightVariable": "text/display-xl/line-height" } ],
  "effectStyles": [
    { "name": "shadow/sm", "type": "DROP_SHADOW", "color": { "r": 0, "g": 0, "b": 0, "a": 0.05 },
      "offset": { "x": 0, "y": 2 }, "radius": 8, "spread": 0 } ]
}
```

Reglas:
- `aliasOf` es el nombre del primitivo cuando el semántico tiene alfa 1, y `null` si tiene alfa. `values` siempre lleva el color resuelto.
- La line-height va en px (`Math.round(size * ratio)`) por modo.
- `letterSpacingPercent` = `em * 100`, redondeado a 2 decimales.
- Motion no se exporta (Figma no tiene variables de motion; se documenta en el subproyecto 5).

- [ ] **Step 1: Test que falla**

```js
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
```

Run: `npx vitest run test/figma.test.js`
Expected: FAIL.

- [ ] **Step 2: Implementación**

`src/render/figma.js`:

```js
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
```

- [ ] **Step 3: Verificar**

Run: `npx vitest run test/figma.test.js`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/render/figma.js test/figma.test.js
git commit -m "feat: salida tokens.figma.json con colecciones, modos y estilos"
```

---

### Task 9: Build, `dist/`, CI y README

**Files:**
- Create: `src/build.js`, `test/package.test.js`, `.github/workflows/ci.yml`, `README.md`, `dist/*` (generados)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: `npm run build` escribe `dist/tokens.css`, `dist/tokens.js`, `dist/tokens.d.ts` y `dist/tokens.figma.json`.

- [ ] **Step 1: Test que falla**

`test/package.test.js`:

```js
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const targets = (entry) => (typeof entry === "string" ? [entry] : Object.values(entry));

describe("package.json exports", () => {
  it.each(Object.entries(pkg.exports))("%s apunta a archivos existentes", (_, entry) => {
    for (const file of targets(entry)) expect(existsSync(file), file).toBe(true);
  });
  it("dist no tiene CRLF", () => {
    for (const file of ["dist/tokens.css", "dist/tokens.js", "dist/tokens.d.ts", "dist/tokens.figma.json"]) {
      expect(readFileSync(file, "utf8"), file).not.toContain("\r");
    }
  });
});
```

Run: `npx vitest run test/package.test.js`
Expected: FAIL (no existe `dist/`).

- [ ] **Step 2: `src/build.js`**

```js
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadTokens } from "./load.js";
import { buildModel } from "./model.js";
import { renderCss } from "./render/css.js";
import { renderFigma } from "./render/figma.js";
import { renderJs } from "./render/js.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const { version } = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));

const model = buildModel(await loadTokens());
const { js, dts } = renderJs(model, version);

mkdirSync(DIST, { recursive: true });
const outputs = {
  "tokens.css": renderCss(model, version),
  "tokens.js": js,
  "tokens.d.ts": dts,
  "tokens.figma.json": renderFigma(model, version),
};
for (const [file, content] of Object.entries(outputs)) {
  writeFileSync(path.join(DIST, file), content, "utf8");
}
console.log(`dist/ generado (v${version}): ${Object.keys(outputs).join(", ")}`);
```

Run: `npm run build`
Expected: `dist/ generado (v0.1.0): tokens.css, tokens.js, tokens.d.ts, tokens.figma.json`.

- [ ] **Step 3: `.github/workflows/ci.yml`**

```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: dist commiteado está al día
        run: git diff --exit-code -- dist
```

- [ ] **Step 4: `README.md`**

Contenido (en español):

1. **Qué es:** fuente única de tokens de TurismoSinPeros. Remite a `docs/specs/` y a la tabla de roles (§4–§8 del spec).
2. **Instalar:** `npm i github:kevind377/turismosinperos-tokens#v0.1.0`.
3. **Web (Tailwind v4):**
   ```css
   @import "tailwindcss";
   @import "@turismosinperos/tokens/tokens.css";
   ```
   Ejemplos: `text-fg-secondary`, `bg-surface-raised`, `text-display-xl font-display`, `pt-nav-height`, `py-section`, `px-gutter`, `max-w-content`, `z-(--z-modal)`, `duration-(--duration-fast)`.
   **Advertencia:** sobrescribe los defaults de Tailwind `--radius-sm…xl`, `--shadow-sm…lg`, `--ease-out` y `--ease-in-out`. En un sitio sin migrar, `rounded-lg` pasa de 8 a 16 px, etc. Hay que migrar esas clases en el mismo cambio en que se instala el paquete.
4. **React Native:** `import { color, text, motion } from "@turismosinperos/tokens";`. Ejemplo de estilo con `text.body.mobile` y de animación con `Easing.bezier(...motion.ease.out)` y `motion.duration.base` (en ms). Las fuentes las carga la app (`fontFamily` trae el nombre base).
5. **Figma:** `@turismosinperos/tokens/figma.json`. Lo importa el subproyecto 5.
6. **Reglas:** semánticos solo por referencia, alfa solo sobre primitivos, piso de 11 px, velos y sombras negros. El build falla si se rompe alguna. `npm test` verifica el contraste AA de los pares del sistema.
7. **Publicar una versión:** editar `tokens/`, `npm test`, `npm run build`, subir `version` en `package.json`, commitear `dist/`, `git tag vX.Y.Z` y `git push --tags`. Cambios incompatibles (renombrar o borrar un token) suben el major.

- [ ] **Step 5: Verificar todo**

Run: `npm run build && npm test`
Expected: todos los tests PASS. Luego `git status` debe mostrar `dist/` nuevo y nada inesperado.

- [ ] **Step 6: Commit**

```bash
git add src/build.js test/package.test.js .github README.md dist
git commit -m "feat: build a dist/, CI y README"
```

---

## Handoff

Al terminar, **no** crear el remoto, no hacer push y no taggear. Reportar:

- la salida de `npm test`,
- cualquier ajuste por diferencias de API en Style Dictionary 5 o `@tailwindcss/node`,
- cualquier caso donde el plan y el spec se contradigan.
