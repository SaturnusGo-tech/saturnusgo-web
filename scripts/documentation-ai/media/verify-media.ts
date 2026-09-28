import { readFileSync, realpathSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { documentationMediaLocale, type DocumentationMedia } from "../../../app/src/modules/core-tms/documentation/model/visual/guide-media";

type MediaCorpus = { articles: readonly { locale: "en" | "ru";
  sections: readonly { media?: readonly DocumentationMedia[] }[] }[] };

/** Fail the release export if an illustration is absent, outside public, or from another locale. */
export function verifyGuideMedia(corpus: MediaCorpus, publicDirectory: string) {
  const root = realpathSync(resolve(publicDirectory)), verified = new Set<string>();
  for (const article of corpus.articles) for (const section of article.sections) for (const media of section.media ?? []) {
    if (documentationMediaLocale(media.src) !== article.locale) {
      throw new Error(`Invalid ${article.locale} guide screenshot: ${media.src}`);
    }
    if (verified.has(media.src)) continue;
    const asset = join(root, media.src.slice(1));
    let actual: string;
    try { actual = realpathSync(asset); }
    catch { throw new Error(`Missing guide screenshot: ${media.src}`); }
    const path = relative(root, actual);
    if (path === ".." || path.startsWith(`..${sep}`) || !statSync(actual).isFile()) {
      throw new Error(`Guide screenshot must be a file inside public: ${media.src}`);
    }
    const data = readFileSync(actual);
    if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8 || data[2] !== 0xff) {
      throw new Error(`Guide screenshot must contain JPEG data: ${media.src}`);
    }
    verified.add(media.src);
  }
}
