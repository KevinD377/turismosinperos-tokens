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
