# Sistema de diseño TurismoSinPeros — Subproyecto 1: definición

Fecha: 2026-10-03 · Rama: `feature/design-system` (sale de `main` 3f5e783) · Estado: spec para revisión

## 1. Objetivo

Una sola fuente de verdad para la marca TurismoSinPeros, consumible por:

- webs React + Tailwind v4 (este sitio y futuras),
- la app de audioguías (Expo / React Native, `C:/dev/audioguias`),
- Figma (variables) y, desde ahí, piezas de redes e impresos.

Éxito: (a) cero valores visuales arbitrarios en el código de las apps consumidoras, (b) documentación que
alguien externo puede seguir sin leer código, (c) todo par de texto/fondo del sistema cumple WCAG AA.

Este documento define **qué** es el sistema (escalas, roles, nombres y la tabla de migración). No define
el paquete ni la migración, que son subproyectos aparte (ver §10).

## 2. Decisiones tomadas (con el usuario, 2026-10-03)

| Tema | Decisión |
|---|---|
| Plataformas | Web + React Native + Figma/piezas |
| Formato fuente | JSON DTCG, build con Style Dictionary v4 |
| Dónde vive | Repo propio `turismosinperos-tokens`, consumido como dependencia git con tag |
| Cambio visual | Normalizar al token más cercano; el usuario revisa en pantalla cada zona |
| Documentación | `DESIGN.md` en el repo de tokens = fuente; página de marca y Figma se generan desde los tokens |
| Velos / degradados sobre imagen | Negro, nunca cherry |
| Sombras | Negras |
| Piso tipográfico | 11 px |
| 13 px → 14 px | Sí, se revisa pantalla por pantalla en la migración |

## 3. Arquitectura de tokens

Tres capas. Las apps solo usan las capas 2 y 3; la capa 1 existe para alimentarlas.

1. **Primitivos** — la paleta y los valores crudos. Nombres de color (`cherry-950`).
2. **Semánticos** — roles (`fg-secondary`, `surface-raised`, `radius-card`). Es lo que se escribe en el código.
3. **Presets de plataforma** — solo donde la plataforma lo necesita (presets de motion en `src/lib/motion.ts`,
   utilidad `overline`). No viven en el paquete.

Regla: un semántico siempre referencia un primitivo (`{color.cherry-950}` con alfa), nunca un hex nuevo.

### Nombres en Tailwind v4

Los semánticos de color se nombran para que la utilidad se lea bien: `--color-fg-secondary` → `text-fg-secondary`,
`--color-surface-raised` → `bg-surface-raised`, `--color-line` → `border-line`. Prefijos: `fg` (texto e íconos),
`surface` (fondos), `line` (bordes y separadores), `action` (botones), `scrim` (velos), `focus`.

Los primitivos siguen existiendo como utilidades (`bg-rosewood-400`) para rellenos decorativos e
ilustración, pero **nunca para texto**: eso lo controla el check de tokens del subproyecto 3.

## 4. Color

### 4.1 Primitivos

| Token | Valor | Nota |
|---|---|---|
| `cherry-950` | `#26141A` | |
| `cherry-900` | `#180B10` | |
| `rosewood-400` | `#AA6B76` | solo relleno, ícono o texto ≥24 px |
| `rosewood-600` | `#8C4F5A` | |
| `olive-500` | `#847225` | solo relleno, ícono o texto ≥24 px |
| `olive-600` | `#6B5C1E` | |
| `bone-200` | `#DBCCB5` | |
| `humo` | `#F2F4F3` | |
| `white` | `#FFFFFF` | **nuevo oficial**: superficie de tarjeta |
| `black` | `#000000` | **nuevo oficial**: solo velos y sombras |

Fuera del sistema, documentados como "de terceros" y exentos del check: colores de banderas
(`#C8102E`, `#012169`, `#FFE600`…) y marca de Mercado Pago.

### 4.2 Semánticos

Contraste medido sobre `humo` salvo que se indique.

**Texto sobre fondo claro**

| Token | Valor | Contraste |
|---|---|---|
| `fg` | cherry-950 | 15.9 |
| `fg-secondary` | cherry-950 / 70 % | 6.2 (6.5 sobre white, 5.2 sobre bone-200) |
| `fg-disabled` | cherry-950 / 40 % | exento (deshabilitado) |
| `fg-accent` | rosewood-600 | 5.6 |
| `fg-positive` | olive-600 | 6.0 |

**Texto sobre fondo oscuro (cherry-950)**

| Token | Valor | Contraste |
|---|---|---|
| `fg-inverse` | humo | 15.9 |
| `fg-inverse-secondary` | humo / 75 % | 9.3 |
| `fg-inverse-accent` | bone-200 | 11.1 |

**Superficies**

| Token | Valor |
|---|---|
| `surface` | humo (fondo de página) |
| `surface-raised` | white (tarjetas, paneles) |
| `surface-muted` | bone-200 (bloques cálidos, placeholders) |
| `surface-inverse` | cherry-950 |
| `surface-accent-subtle` | rosewood-400 / 10 % |
| `surface-positive-subtle` | olive-500 / 12 % |

**Bordes**

| Token | Valor |
|---|---|
| `line` | bone-200 |
| `line-subtle` | cherry-950 / 10 % |
| `line-strong` | cherry-950 / 25 % |
| `line-inverse` | humo / 30 % |

**Acciones**

| Token | Reposo | Hover | Texto |
|---|---|---|---|
| `action-primary` | cherry-950 | cherry-900 | humo |
| `action-secondary` | olive-500 | olive-600 | white (4.76) |
| `action-accent` | rosewood-600 | cherry-950 | white (6.2) |

`action-accent` reemplaza el botón rosewood-400 + texto blanco actual (4.14, no pasa AA).

**Foco**: `focus` = rosewood-600 (anillo de 2 px, offset 2 px); `focus-inverse` = bone-200 sobre fondos oscuros.

**Velos** (negro, decisión del usuario)

| Token | Valor | Uso |
|---|---|---|
| `scrim-soft` | black / 40 % | degradé suave para leer texto sobre foto |
| `scrim-medium` | black / 55 % | velo plano (CTA de audioguías) |
| `scrim-strong` | black / 80 % | modales, lightbox |

### 4.3 Migración de color

| Hoy | Pasa a |
|---|---|
| `text-cherry-950` | `text-fg` |
| `text-cherry-950/{30…80}` en texto informativo | `text-fg-secondary` |
| `text-cherry-950/{30…45}` en deshabilitado o placeholder | `text-fg-disabled` |
| `text-rosewood-400` en texto <24 px | `text-fg-accent` |
| `text-rosewood-400` en texto ≥24 px o ícono | queda como primitivo |
| `text-rosewood-600` | `text-fg-accent` |
| `text-olive-500` / `text-olive-600` en texto <24 px | `text-fg-positive` |
| `text-humo` sobre oscuro | `text-fg-inverse` |
| `text-humo/{50…75}`, `text-white/{60…80}` sobre oscuro | `text-fg-inverse-secondary` |
| `text-bone-200(/…)` sobre oscuro | `text-fg-inverse-accent` |
| `bg-humo` | `bg-surface` |
| `bg-white` | `bg-surface-raised` |
| `bg-cherry-950` (bloque) | `bg-surface-inverse` |
| `bg-bone-200` (sólido, 43 usos) | `bg-surface-muted` (bone-200): bloques cálidos, placeholders de imagen; si es línea, `line` |
| `bg-olive-500`, `bg-olive-600` en botones | `action-secondary`; si es relleno decorativo queda primitivo |
| `bg-rosewood-400` sólido | `action-accent` si es botón; si es relleno decorativo queda primitivo |
| `bg-cherry-900` | hover de `action-primary` |
| `bg-rosewood-400/{8…25}` | `bg-surface-accent-subtle` |
| `bg-olive-500/{8…15}` | `bg-surface-positive-subtle` |
| `bg-bone-200/{10…70}`, `bg-humo/{5…40}` | `bg-surface-accent-subtle` o `line-subtle` según el caso; se decide en migración |
| `border-bone-200(/…)` | `border-line` |
| `border-cherry-950/{5…15}` | `border-line-subtle` |
| `border-cherry-950/{20…30}`, `border-cherry-950` | `border-line-strong` |
| `border-humo/…`, `border-white/…` sobre oscuro | `border-line-inverse` |
| `outline-/ring-rosewood-400`, `outline-/ring-rosewood-600` | `focus` |
| `from-/via-/to-cherry-950/…`, `bg-black/50`, `bg-black/80` en velos | `scrim-*` (en negro) |

## 5. Tipografía

### 5.1 Familias y pesos

- `font-display`: Marcellus 400. Solo títulos display; la jerarquía sale del tamaño.
- `font-sans`: Work Sans 400 (cuerpo), 600 (énfasis, botones, overline), 700 (títulos sans, badges).

### 5.2 Escala display (Marcellus, fluida 375 → 1280 px)

| Token | Móvil → desktop | `font-size` | line-height | tracking |
|---|---|---|---|---|
| `display-xl` | 44 → 64 | `clamp(2.75rem, 2.232rem + 2.210vw, 4rem)` | 1.1 | −0.02em |
| `display-lg` | 32 → 48 | `clamp(2rem, 1.586rem + 1.768vw, 3rem)` | 1.1 | −0.02em |
| `display-md` | 24 → 32 | `clamp(1.5rem, 1.293rem + 0.884vw, 2rem)` | 1.15 | −0.02em |
| `display-sm` | 20 → 24 | `clamp(1.25rem, 1.146rem + 0.442vw, 1.5rem)` | 1.2 | −0.01em |

Uso: `display-xl` H1 de hero o página; `display-lg` H2 de sección; `display-md` título de bloque;
`display-sm` título de tarjeta. El nivel de heading (H1–H6) lo decide la semántica, no el token.

### 5.3 Escala de texto (Work Sans, fija)

| Token | Tamaño | line-height | Extras |
|---|---|---|---|
| `body-lg` | 18 | 1.6 | |
| `body` | 16 | 1.6 | |
| `body-sm` | 14 | 1.5 | |
| `caption` | 12 | 1.4 | |
| `overline` | 11 | 1.3 | 600, mayúsculas, +0.16em |

Piso absoluto: 11 px. Ningún texto del sistema baja de ahí.

### 5.4 Migración tipográfica

| Hoy | Pasa a |
|---|---|
| `clamp(...)` de hero/página, `text-5xl+` en display | `display-xl` |
| `text-4xl`, `text-5xl` en H2, `[40px]`, `[32px]` | `display-lg` |
| `text-2xl`, `text-3xl`, `[24px]`–`[28px]` en display | `display-md` |
| `text-xl`, `[19px]`, `[20px]` en display | `display-sm` |
| `text-lg`, `[17px]`, `[19px]` en sans | `body-lg` |
| `text-base`, `[15px]` | `body` |
| `text-sm`, `[13px]`, `[13.5px]`, `[14px]` | `body-sm` (13 → 14 se revisa en pantalla) |
| `text-xs`, `[11.5px]`, `[12px]`, `[12.5px]` | `caption` |
| `[8px]`–`[11px]` + `uppercase` | `overline` |
| `[8px]`–`[10.5px]` sin mayúsculas | `caption` |
| `sm:/md:/lg:text-*` en títulos display | se eliminan (el token ya es fluido) |
| `tracking-[0.04em]`…`tracking-[0.18em]`, `tracking-wide(st)` | `overline` o se quita |
| `tracking-[-0.01em]`, `tracking-[-0.02em]`, `tracking-tight` | incluido en el token display |
| `text-[19.4cqw]`, `text-[12.6cqw]` (logotipo) | exento: tamaño de marca atado al contenedor |

## 6. Espaciado y layout

- **Escala base**: la de Tailwind, de a 4 px. No se renombra.
- **Arbitrarios** van al paso más cercano: 14 → 16, 18 → 16, 22 → 24, 25/26/27 → 24 o 28, 34 → 32, 38 → 40, 70 → 72.

| Token | Valor |
|---|---|
| `nav-height` | 84 px (móvil) / 76 px (≥ lg). Reemplaza `pt-[84px]`, `pt-[76px]`, `-mt-[…]` y `src/lib/layout.ts` |
| `section-y` | `clamp(4rem, 2.343rem + 7.072vw, 8rem)` (64 → 128) |
| `gutter` | `clamp(1rem, -0.657rem + 7.072vw, 5rem)` (16 → 80) |
| `container-prose` | 42rem (672) |
| `container-content` | 72rem (1152) |
| `container-wide` | 80rem (1280) |
| `measure` | 65ch, ancho máximo de párrafo |

`max-w-[1400px]` y `max-w-[1568px]` pasan a `container-wide` o a ancho completo; se decide caso a caso en migración.

## 7. Radio, sombra y capas

**Radio**

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 8 | badges, inputs chicos |
| `radius-md` | 12 | inputs, chips |
| `radius-lg` | 16 | tarjetas |
| `radius-xl` | 28 | medios grandes, sheets, modales |
| `radius-full` | 9999 | botones pill, avatares |

Hoy → token: `rounded`, `-sm`, `-md`, `[2px]`, `[9px]`, `[10px]` → `sm`; `-lg`, `-xl` → `md`; `-2xl`, `[20px]` → `lg`;
`-3xl`, `[28px]`–`[31px]` → `xl`. Las formas orgánicas (`rounded-[40%_60%…]`) son decorativas y quedan exentas.

**Sombra** (negra; opacidad a calibrar en revisión visual)

| Token | Valor | Uso |
|---|---|---|
| `shadow-sm` | `0 2px 8px rgb(0 0 0 / 5%)` | tarjeta en reposo |
| `shadow-md` | `0 8px 24px rgb(0 0 0 / 10%)` | hover, dropdown |
| `shadow-lg` | `0 16px 40px rgb(0 0 0 / 14%)` | modal, sheet |

Las 15 variantes actuales (grises de Tailwind y tintadas de cherry) van al nivel más cercano por tamaño.

**Capas (z-index)**: `base` 0 · `sticky` 10 · `nav` 40 · `overlay` 50 · `modal` 60 · `toast` 70.

## 8. Motion

| Grupo | Token | Valor |
|---|---|---|
| Curva | `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)`: todo lo que entra o aparece |
| | `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)`: desplazamientos en pantalla |
| | `linear` | solo marquesinas y loops |
| Duración | `instant` | 150 ms: color, hover, press |
| | `fast` | 250 ms: dropdown, toggle, tooltip |
| | `base` | 400 ms: paneles, modales, sheets |
| | `slow` | 600 ms: reveal al hacer scroll |
| | `slower` | 900 ms: intro de hero o página, transición del lector |
| Distancia | `distance-sm` / `-md` / `-lg` | 8 / 16 / 24 px (24 = reveal por defecto) |
| Stagger | `stagger` | 70 ms, como mucho 6 pasos |
| Resorte | `spring-snappy` | rigidez 500, amortiguación 32 |
| | `spring-gentle` | rigidez 260, amortiguación 25 |
| Interacción | `press-scale` | 0.98 |
| | `hover-scale` | 1.04 (imágenes) |
| | `hover-lift` | −2 px (tarjetas) |
| Viewport | reveal | `once: true, amount: 0.2` |

Migración: 0.2 → `instant`; 0.25, 0.3 y `duration-300` → `fast`; 0.35–0.45 → `base`; 0.5–0.7 → `slow`;
0.85–0.9 → `slower`; `"easeOut"` → `ease-out`; `ease-in-out` → `ease-in-out`; resortes 420/36, 520/32 y 500/28 →
`spring-snappy`; 260/25 → `spring-gentle`; `y` 6/8 → `sm`, 12/16/18 → `md`, 24 → `lg`; `scale 1.05` → 1.04;
los tres `viewport` → uno. Marquesinas (15–60 s): duración libre, curva `linear`.

**Movimiento reducido** (obligatorio, hoy no existe a nivel global en `main`):
`<MotionConfig reducedMotion="user">` en la raíz, más una regla CSS global para animaciones y transiciones CSS.
Con reducido: los reveals quedan como fade sin desplazamiento, las marquesinas se detienen y los resortes
se vuelven instantáneos. Nada se oculta ni se pierde contenido.

## 9. Salidas por plataforma

| Salida | Contenido | Notas |
|---|---|---|
| `tokens.css` | bloque `@theme` de Tailwind v4 con primitivos y semánticos | tamaños con `--text-*--line-height`, `--letter-spacing` y `--font-weight` |
| `tokens.ts` (RN) | objetos tipados (`color`, `font`, `space`, `radius`, `shadow`, `motion`) con valores resueltos | colores con alfa como `rgba()`; display con `{ mobile, desktop }` porque RN no tiene `clamp`; curvas como tupla para `Easing.bezier` |
| `tokens.figma.json` | variables con dos modos (Mobile y Desktop) | motion no se exporta como variable, solo se documenta |
| `DESIGN.md` | reglas de uso, qué hacer y qué no, pares de contraste, ejemplos | fuente de la página de marca |

## 10. Subproyectos siguientes (cada uno con su spec y plan)

2. **Paquete `turismosinperos-tokens`**: repo, JSON DTCG, Style Dictionary v4, las 4 salidas, release con tags.
3. **Migración web**: instalar el paquete, `src/lib/motion.ts`, `MotionConfig` global, check de tokens
   (script que falla ante `text-[`, `rounded-[`, `cherry-950/NN` en texto, hex fuera de exentos),
   migración por zonas (pública → cuenta/admin), con revisión visual del usuario por zona.
4. **Migración de la app de audioguías**: reemplazar colores escritos a mano por `tokens.ts`.
5. **Documentación**: `DESIGN.md`, página de marca compartible generada desde los tokens y librería en Figma.

Todo el código de los subproyectos 2–4 lo escribe Codex (`--model gpt-6.1-sol --effort medium`) y Claude audita.

## 11. Riesgos

- **Cambio visual acumulado.** Mitigación: migración por zonas, capturas de antes y después, y aprobación del usuario por zona.
- **Mapeos ambiguos** (p. ej. `bg-bone-200/40`). Mitigación: la tabla marca los casos "se decide en migración"; Codex los lista en vez de adivinar.
- **Ramas paralelas** (`feature/patrimonio-retiro`, `preview`) tocan los mismos componentes. Mitigación: migrar después de que esas ramas lleguen a `main`, o por zonas que no se pisen.
- **Dependencia git en Vercel y EAS.** Si el repo de tokens es privado, ambos builds necesitan acceso. Se resuelve en el subproyecto 2 (repo público o token de deploy).
