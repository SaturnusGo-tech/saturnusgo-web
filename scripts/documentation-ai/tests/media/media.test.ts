import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { docArticles as en } from "../../../../app/src/modules/core-tms/documentation/content/catalog";
import { docArticles as ru } from "../../../../app/src/modules/core-tms/documentation/content-ru/catalog";
import { documentationMediaLocale, documentationSectionMedia } from "../../../../app/src/modules/core-tms/documentation/model/visual/guide-media";
import type { DocArticle, DocSection } from "../../../../app/src/modules/core-tms/documentation/model/article";
import { buildGuideCorpus } from "../../corpus";
import { verifyGuideMedia } from "../../media/verify-media";

const step = { title: "Choose a file", instruction: "Select JSON", result: "A file is ready",
  image: { src: "/falcon/docs/2026-09/import-example.jpg", alt: "File selected", width: 1440, height: 900 } };
const section: DocSection = { id: "import", title: "Import", blocks: [
  { kind: "paragraph", text: "Start here" },
  { kind: "walkthrough", title: "Import workflow", steps: [step, step] },
] };

test("media identity is section-local, unique and unaffected by surrounding prose", () => {
  const media = documentationSectionMedia(section);
  assert.deepEqual(media, [
    { id: "import-example", title: step.title, instruction: step.instruction, result: step.result, src: step.image.src, alt: step.image.alt },
    { id: "import-example-2", title: step.title, instruction: step.instruction, result: step.result, src: step.image.src, alt: step.image.alt },
  ]);
  assert.deepEqual(documentationSectionMedia({ ...section, blocks: [{ kind: "paragraph", text: "New introduction" }, ...section.blocks] }), media);
  assert.deepEqual(documentationSectionMedia({ ...section, blocks: [{ kind: "paragraph", text: "Text only" }] }), []);
  assert.equal(documentationMediaLocale("/falcon/docs/2026-10/next-release.jpg"), "en");
  assert.equal(documentationMediaLocale("/falcon/docs/2027-01-ru/next-release.jpg"), "ru");
  assert.equal(documentationMediaLocale("/falcon/docs/2027-13/invalid-month.jpg"), null);
});

test("every exported illustration exactly matches a real localized guide step", () => {
  const corpus = buildGuideCorpus({ en, ru });
  let count = 0;
  for (const article of corpus.articles) {
    const source = (article.locale === "en" ? en : ru).find(value => value.id === article.id)!;
    for (const exported of article.sections) {
      const expected = documentationSectionMedia(source.sections.find(value => value.id === exported.id)!);
      assert.deepEqual(exported.media ?? [], expected);
      assert.equal(new Set(expected.map(value => value.id)).size, expected.length);
      for (const image of expected) {
        assert.equal(documentationMediaLocale(image.src), article.locale);
        assert.ok(image.title && image.instruction && image.result && image.alt);
        count++;
      }
    }
  }
  assert.ok(count >= 190);
  verifyGuideMedia(corpus, join(process.cwd(), "public"));
});

test("export rejects remote, traversing and cross-locale screenshot paths", () => {
  const make = (src: string): DocArticle => ({ id: "example", title: "Example", description: "Test", keywords: [], group: "start", related: [],
    sections: [{ ...section, blocks: [{ kind: "walkthrough", title: "Procedure", steps: [{ ...step, image: { ...step.image, src } }] }] }] });
  for (const src of ["https://example.com/x.jpg", "//example.com/x.jpg", "/falcon/docs/2026-09/../secret.jpg",
    "/falcon/docs/2026-09/x.jpg?token=x", "/falcon/docs/2026-09/x.jpg#x"]) {
    assert.throws(() => documentationSectionMedia(make(src).sections[0]), /screenshot/i);
  }
  assert.throws(() => buildGuideCorpus({ en: [make(step.image.src)], ru: [make(step.image.src)] }), /locale/i);
});

test("file verification rejects missing, non-JPEG and escaping symlink assets", () => {
  const directory = mkdtempSync(join(tmpdir(), "falcon-guide-media-")), root = join(directory, "public");
  const file = join(root, "falcon/docs/2026-09/import-example.jpg");
  const corpus = { articles: [{ locale: "en" as const, sections: [{ media: documentationSectionMedia(section) }] }] };
  try {
    mkdirSync(dirname(file), { recursive: true });
    assert.throws(() => verifyGuideMedia(corpus, root), /screenshot/i);
    writeFileSync(file, "not an image");
    assert.throws(() => verifyGuideMedia(corpus, root), /JPEG/i);
    rmSync(file);
    const outside = join(directory, "outside.jpg"); writeFileSync(outside, Buffer.from([255, 216, 255, 217]));
    symlinkSync(outside, file);
    assert.throws(() => verifyGuideMedia(corpus, root), /public/i);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
