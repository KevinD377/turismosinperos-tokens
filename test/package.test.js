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
