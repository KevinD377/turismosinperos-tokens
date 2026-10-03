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
