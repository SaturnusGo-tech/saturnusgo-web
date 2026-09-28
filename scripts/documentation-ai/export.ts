import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { docArticles as en } from "../../app/src/modules/core-tms/documentation/content/catalog";
import { docArticles as ru } from "../../app/src/modules/core-tms/documentation/content-ru/catalog";
import { buildGuideCorpus } from "./corpus";
import { verifyGuideMedia } from "./media/verify-media";

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2 || !["--output", "--check"].includes(args[0]) || !args[1] || args[1].startsWith("--")) {
    throw new Error("Usage: npx tsx scripts/documentation-ai/export.ts <--output|--check> <corpus.json>");
  }
  const corpus = buildGuideCorpus({ en, ru });
  verifyGuideMedia(corpus, resolve("public"));
  const serialized = `${JSON.stringify(corpus, null, 2)}\n`;
  const target = resolve(args[1]);
  if (args[0] === "--check") {
    const actual = await readFile(target, "utf8");
    if (actual !== serialized) throw new Error(`Documentation corpus is stale: ${target}. Regenerate with --output.`);
    console.log(`Documentation corpus matches ${corpus.articles.length} articles (${corpus.version}).`);
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, serialized, "utf8");
    console.log(`Exported ${corpus.articles.length} articles to ${target} (${corpus.version}).`);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
