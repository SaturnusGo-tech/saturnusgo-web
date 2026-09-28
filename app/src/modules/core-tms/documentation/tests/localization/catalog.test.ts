import assert from "node:assert/strict";
import test from "node:test";
import { documentationCatalog } from "../../localization/catalog/locale-catalog";
import { documentationCopy } from "../../localization/ui-copy";
import { searchArticles } from "../../model/search";

for (const locale of ["ru", "en"] as const) {
  test(`${locale}: localized catalog keeps all topics, links and administrator permissions`, () => {
    const all = documentationCatalog(locale, true);
    const other = documentationCatalog(locale === "ru" ? "en" : "ru", true);
    assert.equal(all.locale, locale);
    assert.deepEqual(all.docArticles.map(a => a.id), other.docArticles.map(a => a.id));
    for (const article of all.docArticles) {
      assert.equal(new Set(article.sections.map(s => s.id)).size, article.sections.length, article.id);
      for (const id of article.related) assert.ok(all.articleById.has(id), `${article.id} → ${id}`);
      for (const section of article.sections) for (const block of section.blocks) {
        if (block.kind === "articles") for (const id of block.ids) assert.ok(all.articleById.has(id), id);
      }
      if (locale === "ru") assert.match(article.description, /[А-Яа-яЁё]/u, article.id);
    }
    for (const id of ["create-run", "execute-run", "custom-fields", "navigation", "settings"]) {
      assert.ok(all.articleById.has(id), id);
    }
    const ordinary = documentationCatalog(locale, false);
    assert.equal(ordinary.articleById.has("company-access"), false);
    assert.ok(all.articleById.has("company-access"));
    assert.equal(searchArticles(ordinary.docArticles, locale === "ru" ? "личный профиль" : "personal profile", locale)
      .some(result => result.article.id === "company-access"), false);
  });
}
test("locale change selects a separate complete catalog and search index", () => {
  const ru = documentationCatalog("ru", false), en = documentationCatalog("en", false);
  assert.notEqual(ru, en);
  assert.match(ru.articleById.get("settings")!.title, /Настройки/i);
  assert.match(en.articleById.get("settings")!.title, /settings/i);
  assert.ok(searchArticles(ru.docArticles, "редактирование", "ru").length);
  assert.ok(searchArticles(en.docArticles, "edit run", "en").length);
  assert.deepEqual(searchArticles(ru.docArticles, "ПРОГОН", "ru").map(r => r.article.id), searchArticles(ru.docArticles, "прогон", "ru").map(r => r.article.id));
  assert.deepEqual(Object.keys(documentationCopy.ru).sort(), Object.keys(documentationCopy.en).sort());
});
