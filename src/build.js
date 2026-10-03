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
