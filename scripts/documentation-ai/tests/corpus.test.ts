import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { docArticles as en } from "../../../app/src/modules/core-tms/documentation/content/catalog";
import { docArticles as ru } from "../../../app/src/modules/core-tms/documentation/content-ru/catalog";
import type { DocArticle, DocBlock } from "../../../app/src/modules/core-tms/documentation/model/article";
import { buildGuideCorpus } from "../corpus";

const blocks: DocBlock[] = [
  { kind: "paragraph", text: "A paragraph." },
  { kind: "list", items: ["First item", "Second item"], ordered: true },
  { kind: "steps", items: [{ title: "Step title", text: "Step instructions" }] },
  { kind: "callout", tone: "warning", title: "Caution", text: "Verify before saving" },
  { kind: "table", columns: ["Name", "Meaning"], rows: [["Pass", "Successful check"]] },
  { kind: "code", language: "json", caption: "Example payload", text: '{"result":"pass"}' },
  { kind: "articles", ids: ["example"] },
  { kind: "walkthrough", title: "Recorded workflow", steps: [{ title: "Open run",
    instruction: "Select a run", result: "The run opens", image: {
      src: "/falcon/docs/2026-09/example.jpg", alt: "Run status and owner", width: 1200, height: 800,
    } }] },
];
const example: DocArticle = {
  id: "example", title: "Example article", description: "Example description", group: "start",
  keywords: ["example"], related: [], adminOnly: true, status: "planned",
  sections: [{ id: "procedure", title: "Procedure", blocks }],
};
const russian = (article: DocArticle): DocArticle => JSON.parse(JSON.stringify(article).replaceAll("/2026-09/", "/2026-09-ru/"));
const editions = (articles: DocArticle[]) => ({ en: articles, ru: articles.map(russian) });

test("export retains instructions from every block and keeps image metadata separate from text", () => {
  const corpus = buildGuideCorpus(editions([example]));
  const article = corpus.articles.find(entry => entry.locale === "en")!;
  assert.equal(article.adminOnly, true);
  assert.equal(article.status, "planned");
  for (const expected of ["A paragraph.", "First item", "Second item", "Step title", "Step instructions",
    "Caution", "Verify before saving", "Name", "Meaning", "Pass", "Successful check",
    "json", "Example payload", '{"result":"pass"}', "Example article", "example",
    "Recorded workflow", "Open run", "Select a run", "The run opens", "Run status and owner"]) {
    assert.ok(article.sections[0].text.includes(expected), expected);
  }
  assert.ok(!article.sections[0].text.includes("example.jpg"));
  assert.equal(article.sections[0].media?.[0].src, "/falcon/docs/2026-09/example.jpg");
});

test("canonical version is repeatable, ignores catalog ordering and changes with instructions", () => {
  const second = { ...example, id: "second", adminOnly: false, status: undefined };
  const first = buildGuideCorpus(editions([example, second]));
  const reordered = buildGuideCorpus(editions([second, example]));
  assert.deepEqual(first, reordered);
  assert.equal(first.version, createHash("sha256").update(JSON.stringify(first.articles)).digest("hex"));
  const changed = { ...second, description: "Changed procedure" };
  assert.notEqual(buildGuideCorpus({ en: [example, changed], ru: [russian(example), russian(second)] }).version, first.version);
  assert.equal(first.articles.find(article => article.id === "second")?.status, "available");
});

test("every current locale article and addressable section reaches the corpus unchanged", () => {
  const corpus = buildGuideCorpus({ en, ru });
  assert.equal(corpus.articles.length, en.length + ru.length);
  for (const [locale, catalog] of Object.entries({ en, ru })) for (const source of catalog) {
    const exported = corpus.articles.find(article => article.locale === locale && article.id === source.id)!;
    assert.ok(exported, `${locale}:${source.id}`);
    assert.equal(exported.title, source.title);
    assert.equal(exported.description, source.description);
    assert.deepEqual(exported.keywords, source.keywords);
    assert.equal(exported.adminOnly, source.adminOnly === true);
    assert.equal(exported.status, source.status ?? "available");
    assert.deepEqual(exported.sections.map(section => [section.id, section.title]), source.sections.map(section => [section.id, section.title]));
    assert.ok(exported.sections.every(section => section.text.trim()));
    for (const section of source.sections) for (const block of section.blocks) {
      if (block.kind === "walkthrough") for (const step of block.steps) {
        assert.ok(exported.sections.find(entry => entry.id === section.id)!.text.includes(step.instruction));
        assert.ok(exported.sections.find(entry => entry.id === section.id)!.text.includes(step.result));
      }
    }
  }
});

test("invalid duplicate identities and locale drift fail export instead of losing sources", () => {
  assert.throws(() => buildGuideCorpus({ en: [example, example], ru: [example] }), /duplicate/i);
  assert.throws(() => buildGuideCorpus({ en: [example], ru: [] }), /locale/i);
  const duplicate = { ...example, sections: [...example.sections, ...example.sections] };
  assert.throws(() => buildGuideCorpus({ en: [duplicate], ru: [example] }), /section/i);
});
