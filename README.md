# @turismosinperos/tokens

Fuente única de tokens de diseño de TurismoSinPeros en JSON DTCG. Genera salidas para Tailwind v4, React Native/JavaScript y Figma con Style Dictionary 5.

La [definición del sistema](docs/specs/2026-10-03-sistema-de-diseno-definicion.md) describe los roles de color, tipografía, layout, forma y motion en §4–§8 y las reglas de migración. El [plan del paquete](docs/plans/2026-10-03-paquete-tokens.md) especifica las interfaces y salidas. `DESIGN.md` y la documentación visual se completan en el subproyecto 5.

## Instalar

```sh
npm i github:kevind377/turismosinperos-tokens#v0.1.0
```

Requiere Node ≥22. La instalación por git consume `dist/` ya generado y commiteado; no ejecuta un build mediante `prepare`. El comando de instalación requiere que el repo y el tag hayan sido publicados.

## Web con Tailwind v4

```css
@import "tailwindcss";
@import "@turismosinperos/tokens/tokens.css";
```

Usá los roles semánticos para texto y superficies. Ejemplos: `text-fg-secondary`, `bg-surface-raised`, `text-display-xl font-display`, `pt-nav-height`, `py-section`, `px-gutter`, `max-w-content`, `z-(--z-modal)` y `duration-(--duration-fast)`.

Los tamaños display y el espaciado de sección y gutter son fluidos entre 375 y 1280 px. `nav-height` cambia de 84 a 76 px a partir de `64rem`. `text-overline` aporta tamaño, peso y tracking; agregá `uppercase` para las mayúsculas y `font-sans` para la familia.

**Advertencia de migración:** este paquete sobrescribe los defaults de Tailwind `--radius-sm…xl`, `--shadow-sm…lg`, `--ease-out` y `--ease-in-out`. En un sitio sin migrar, `rounded-lg` pasa de 8 a 16 px y cambia el aspecto de sombras y animaciones. Migrá esas clases en el mismo cambio en que instalás el paquete, usando las tablas de la definición.

## React Native

```js
import { Easing } from "react-native";
import { color, text, motion } from "@turismosinperos/tokens";

const bodyStyle = {
  ...text.body.mobile,
  fontFamily: text.body.fontFamily,
  fontWeight: String(text.body.fontWeight),
  textTransform: text.body.textTransform,
  color: color.fg,
};

const animationConfig = {
  easing: Easing.bezier(...motion.ease.out),
  duration: motion.duration.base,
  useNativeDriver: true,
};
```

La app carga las fuentes: `fontFamily` trae el nombre base (`Work Sans` o `Marcellus`). Los tamaños, line-height y letter-spacing están en px por modo `mobile` y `desktop`; las duraciones están en ms. Los colores con alfa se exportan como `rgba()`. `container.measure` se omite porque React Native no soporta `ch`.

Hay exports nombrados `color`, `font`, `text`, `spacing`, `container`, `radius`, `shadow`, `z`, `motion` y `tokens` (que agrupa los anteriores). El paquete incluye declaraciones `tokens.d.ts`.

## Figma

La salida `@turismosinperos/tokens/figma.json` la importa el subproyecto 5. Incluye colecciones Primitivos, Semánticos, Responsive (Mobile/Desktop) y Forma, además de estilos de texto y efectos. Conserva los alias de colores opacos y resuelve los valores con alfa. Motion se documenta en ese subproyecto y no se exporta a variables de Figma.

## Reglas y desarrollo

Los colores semánticos referencian colores de la paleta; el alfa solo se aplica sobre referencias a primitivos. El piso tipográfico es 11 px. Velos y sombras son negros. El build falla si se rompen estas reglas. `npm test` verifica el contraste WCAG AA de los 22 pares de texto/fondo y foco del sistema; los deshabilitados están exentos.

```sh
npm run build
npm test
```

Editá la fuente en `tokens/`; las salidas de `dist/` son generadas y deben commitearse. El CI instala dependencias, genera `dist/`, ejecuta los tests y comprueba que `dist/` no cambió. Todos los archivos generados usan LF.

## Publicar una versión

1. Editá `tokens/` y subí `version` en `package.json` (actualizá también la metadata del lockfile).
2. Ejecutá `npm run build` y `npm test` para verificar la versión y los archivos generados.
3. Commiteá los cambios, incluido `dist/`.
4. Creá el tag `git tag vX.Y.Z` y publicá el commit y los tags con `git push` y `git push --tags`.

Renombrar o borrar un token es un cambio incompatible y sube el major. Las apps consumidoras actualizan el tag de su dependencia para adoptar la nueva versión.
