import assert from "node:assert/strict";
import test from "node:test";
import { docArticles as en } from "../../../app/src/modules/core-tms/documentation/content/catalog";
import { docArticles as ru } from "../../../app/src/modules/core-tms/documentation/content-ru/catalog";
import { buildGuideCorpus } from "../corpus";

const ids = ["overview", "access", "repository", "exchange", "configuration", "execution", "evidence-recovery", "defects", "reporting", "product-docs"].map(id => `codex-capabilities-${id}`);
test("Codex capability routes remain complete and identical in both Help editions and AI grounding", () => {
  const corpus = buildGuideCorpus({ en, ru });
  for (const locale of ["en", "ru"] as const) {
    const catalog = locale === "en" ? en : ru;
    for (const id of ids) {
      const article = catalog.find(item => item.id === id);
      assert.ok(article, `${locale}:${id}`);
      assert.ok(article.sections.length >= 3, id);
      const other = (locale === "en" ? ru : en).find(item => item.id === id)!;
      assert.deepEqual(article.sections.map(section => section.id), other.sections.map(section => section.id), `${id} locale anchors`);
      const grounded = corpus.articles.find(item => item.locale === locale && item.id === id);
      assert.ok(grounded, `${locale}:${id} grounded`);
      assert.deepEqual(grounded.sections.map(section => section.id), article.sections.map(section => section.id));
    }
    const exchange = corpus.articles.find(item => item.locale === locale && item.id === "codex-capabilities-exchange")!;
    assert.ok(exchange.sections.some(section => section.id === "repair"));
    assert.ok(exchange.sections.some(section => section.id === "recover"));
  }
});
