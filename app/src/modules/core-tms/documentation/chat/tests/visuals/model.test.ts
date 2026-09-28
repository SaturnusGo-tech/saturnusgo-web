import assert from "node:assert/strict";
import { test } from "node:test";
import { documentationCatalog } from "../../../localization/catalog/locale-catalog";
import { documentationSectionMedia } from "../../../model/visual/guide-media";
import { visibleGuideVisuals } from "../../model/visuals/visible-visuals";
import type { GuideVisual } from "../../model/conversation";
import { validateGuideAnswer } from "../../data/validate-answer";
import { historicalGuideMedia } from "../../../model/visual/compatibility/historical-media";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function fixture(locale: "ru" | "en" = "en") {
  const catalog = documentationCatalog(locale, false), article = catalog.articleById.get("create-run")!;
  const section = article.sections.find(value => documentationSectionMedia(value).length >= 2)!;
  const items = documentationSectionMedia(section);
  return { catalog, article, section, items,
    visual: { articleId: article.id, sectionId: section.id, layout: "steps", items } as GuideVisual };
}

test("visuals accept only visible local guide images, use canonical copy, and preserve procedure order", () => {
  const { catalog, visual, items } = fixture();
  const reversed = { ...visual, items: [...items].reverse().map(item => ({ ...item, title: "Untrusted label", instruction: "Invented procedure", alt: "Fake alt" })) };
  const visible = visibleGuideVisuals([reversed], catalog.articleById);
  assert.equal(visible.length, 1); assert.deepEqual(visible[0].steps.map(step => step.id), items.map(item => item.id));
  assert.equal(visible[0].steps[0].title, items[0].title); assert.equal(visible[0].steps[0].instruction, items[0].instruction);
  assert.equal(visible[0].steps[0].image.alt, items[0].alt); assert.ok(visible[0].steps[0].image.width > 0);
  assert.ok(visible[0].steps[0].image.height > 0);
  for (const unsafe of [{ ...visual, articleId: "company-access" }, { ...visual, sectionId: "missing" },
    { ...visual, items: items.map(item => ({ ...item, src: "https://attacker.example/track.jpg" })) },
    { ...visual, items: items.map(item => ({ ...item, id: "unknown-id" })) }]) {
    assert.deepEqual(visibleGuideVisuals([unsafe], catalog.articleById), []);
  }
  assert.deepEqual(visibleGuideVisuals([visual], fixture("ru").catalog.articleById), []);
});

test("answer validation matches the server's 16k answer and eight-image total limits", () => {
  const { visual, items } = fixture();
  const base = { answer: "a".repeat(16000), citations: [], knowledgeVersion: "fixture" };
  const eight = { ...visual, items: Array.from({ length: 8 }, (_, index) => ({ ...items[0], id: `item-${index}` })) };
  assert.equal(validateGuideAnswer({ ...base, visuals: [eight] }).visuals?.[0].items.length, 8);
  assert.throws(() => validateGuideAnswer({ ...base, answer: "a".repeat(16001) }));
  assert.throws(() => validateGuideAnswer({ ...base, visuals: [{ ...eight, items: [...eight.items, items[0]] }] }));
  assert.throws(() => validateGuideAnswer({ ...base, visuals: [{ ...eight, items: eight.items.slice(0, 5) }, { ...eight, items: eight.items.slice(0, 4) }] }));
  assert.throws(() => validateGuideAnswer({ ...base, visuals: [{ ...visual, items: [] }] }));
  assert.throws(() => validateGuideAnswer({ ...base, citations: Array.from({ length: 9 }, () => ({ articleId: "a", sectionId: "b", title: "c" })) }));
});

test("all 20 explicitly retained screenshot tuples resolve to current canonical media in their original article and locale", () => {
  assert.equal(historicalGuideMedia.length, 20);
  assert.equal(new Set(historicalGuideMedia.map(item => item.src)).size, 20);
  for (const alias of historicalGuideMedia) {
    const catalog = documentationCatalog(alias.locale, true);
    const bytes = readFileSync(resolve("public", alias.src.slice(1)));
    assert.equal(bytes.readUInt16BE(0), 0xffd8, alias.src); assert.ok(bytes.length < 350_000, alias.src);
    for (const context of alias.contexts) {
      const article = catalog.articleById.get(context.articleId)!;
      const section = article.sections.find(item => item.id === context.sectionId)!;
      const canonical = documentationSectionMedia(section).find(item => item.id === alias.currentId)!;
      assert.equal(canonical.src, alias.currentSrc);
      const supplied = { ...canonical, id: alias.id, src: alias.src, title: "Untrusted saved title", alt: "Untrusted alt" };
      const visible = visibleGuideVisuals([{ ...context, layout: "steps", items: [supplied] }], catalog.articleById);
      assert.equal(visible.length, 1, `${alias.locale}:${context.articleId}:${alias.id}`);
      assert.equal(visible[0].steps[0].image.src, canonical.src);
      assert.equal(visible[0].steps[0].image.alt, canonical.alt); assert.equal(visible[0].steps[0].title, canonical.title);
      assert.ok(visible[0].steps[0].image.width > 0); assert.ok(visible[0].steps[0].image.height > 0);
    }
  }
});

test("historical compatibility rejects changed IDs, URLs, locale, section and inaccessible articles", () => {
  for (const alias of historicalGuideMedia) {
    const catalog = documentationCatalog(alias.locale, true), context = alias.contexts[0];
    const article = catalog.articleById.get(context.articleId)!;
    const canonical = documentationSectionMedia(article.sections.find(item => item.id === context.sectionId)!).find(item => item.id === alias.currentId)!;
    const item = { ...canonical, id: alias.id, src: alias.src }, visual = { ...context, layout: "gallery", items: [item] } as GuideVisual;
    for (const unsafe of [
      { ...visual, items: [{ ...item, src: `${alias.src}?tracking=1` }] },
      { ...visual, items: [{ ...item, src: `https://tms.saturnusgo.com${alias.src}` }] },
      { ...visual, items: [{ ...item, id: alias.currentId }] },
      { ...visual, items: [{ ...item, id: `${alias.id}-2` }] },
      { ...visual, sectionId: "other-section" }, { ...visual, articleId: "create-run" },
    ]) assert.deepEqual(visibleGuideVisuals([unsafe], catalog.articleById), []);
    assert.deepEqual(visibleGuideVisuals([visual], documentationCatalog(alias.locale === "en" ? "ru" : "en", true).articleById), []);
    const restricted = new Map(catalog.articleById); restricted.delete(context.articleId);
    assert.deepEqual(visibleGuideVisuals([visual], restricted), []);
  }
});

test("mixed historical and current selections preserve canonical order without duplicate screenshots", () => {
  const catalog = documentationCatalog("en", true), article = catalog.articleById.get("navigation")!;
  const section = article.sections.find(item => item.id === "walkthrough")!, media = documentationSectionMedia(section);
  const aliases = historicalGuideMedia.filter(item => item.locale === "en" && item.contexts.some(context => context.articleId === "navigation"));
  const items = aliases.map(alias => ({ ...media.find(item => item.id === alias.currentId)!, id: alias.id, src: alias.src }));
  items.reverse(); items.push(media.find(item => item.id === aliases[0].currentId)!);
  const visible = visibleGuideVisuals([{ articleId: article.id, sectionId: section.id, layout: "steps", items }], catalog.articleById);
  assert.deepEqual(visible[0].steps.map(item => item.id), media.filter(item => aliases.some(alias => alias.currentId === item.id)).map(item => item.id));
});
