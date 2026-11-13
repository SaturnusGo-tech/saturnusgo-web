import assert from "node:assert/strict";
import { test } from "node:test";
import { documentationCatalog } from "../../../localization/catalog/locale-catalog";
import { documentationSectionMedia } from "../../../model/visual/guide-media";
import { visibleGuideVisuals } from "../../model/visuals/visible-visuals";
import type { GuideVisual } from "../../model/conversation";
import { validateGuideAnswer } from "../../data/validate-answer";
import { historicalGuideMedia, matchesHistoricalGuideMedia } from "../../../model/visual/compatibility/historical-media";
import { matchesProductionGuideMedia, type ProductionMediaAlias } from "../../../model/visual/compatibility/production-media";
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

test("retained screenshot tuples resolve canonically and the replaced legacy import screenshots stay unavailable", () => {
  assert.equal(historicalGuideMedia.length, 20);
  assert.equal(new Set(historicalGuideMedia.map(item => item.src)).size, 20);
  const retiredImportIds = new Set(["settings-03-exchange-20260928-rows-en-20260928", "settings-03-exchange-20260928"]);
  let retainedContexts = 0, retiredContexts = 0;
  for (const alias of historicalGuideMedia) {
    const catalog = documentationCatalog(alias.locale, true);
    const bytes = readFileSync(resolve("public", alias.src.slice(1)));
    assert.equal(bytes.readUInt16BE(0), 0xffd8, alias.src); assert.ok(bytes.length < 350_000, alias.src);
    for (const context of alias.contexts) {
      const article = catalog.articleById.get(context.articleId)!;
      const section = article.sections.find(item => item.id === context.sectionId)!;
      if (retiredImportIds.has(alias.id)) {
        assert.ok((context.articleId === "import-export" && context.sectionId === "walkthrough")
          || (context.articleId === "permissions" && context.sectionId === "settings-walkthrough"));
        assert.equal(documentationSectionMedia(section).some(item => matchesHistoricalGuideMedia(context.articleId, context.sectionId, alias, item)), false);
        if (context.articleId === "import-export") assert.equal(documentationSectionMedia(section).length, 0, "the redesigned import walkthrough is text-only");
        const retired: GuideVisual = { ...context, layout: "steps", items: [{ id: alias.id, src: alias.src,
          title: "Saved", instruction: "Saved", result: "Saved", alt: "Saved" }] };
        assert.deepEqual(visibleGuideVisuals([retired], catalog.articleById), []);
        retiredContexts++;
        continue;
      }
      const canonical = documentationSectionMedia(section).find(item => matchesHistoricalGuideMedia(context.articleId, context.sectionId, alias, item))!;
      assert.ok(canonical, alias.src);
      const supplied = { ...canonical, id: alias.id, src: alias.src, title: "Untrusted saved title", alt: "Untrusted alt" };
      const visible = visibleGuideVisuals([{ ...context, layout: "steps", items: [supplied] }], catalog.articleById);
      assert.equal(visible.length, 1, `${alias.locale}:${context.articleId}:${alias.id}`);
      assert.equal(visible[0].steps[0].image.src, canonical.src);
      assert.equal(visible[0].steps[0].image.alt, canonical.alt); assert.equal(visible[0].steps[0].title, canonical.title);
      assert.ok(visible[0].steps[0].image.width > 0); assert.ok(visible[0].steps[0].image.height > 0);
      retainedContexts++;
    }
  }
  assert.equal(retainedContexts, 18); assert.equal(retiredContexts, 4);
});

test("historical compatibility rejects changed IDs, URLs, locale, section and inaccessible articles", () => {
  for (const alias of historicalGuideMedia) {
    const catalog = documentationCatalog(alias.locale, true), context = alias.contexts[0];
    const article = catalog.articleById.get(context.articleId)!;
    const canonical = documentationSectionMedia(article.sections.find(item => item.id === context.sectionId)!)
      .find(item => matchesHistoricalGuideMedia(context.articleId, context.sectionId, alias, item))!;
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
  const match = (alias: typeof aliases[number], item: typeof media[number]) => matchesHistoricalGuideMedia(article.id, section.id, alias, item);
  const items = aliases.map(alias => ({ ...media.find(item => match(alias, item))!, id: alias.id, src: alias.src }));
  items.reverse(); items.push(media.find(item => match(aliases[0], item))!);
  const visible = visibleGuideVisuals([{ articleId: article.id, sectionId: section.id, layout: "steps", items }], catalog.articleById);
  assert.deepEqual(visible[0].steps.map(item => item.id), media.filter(item => aliases.some(alias => match(alias, item))).map(item => item.id));
});

test("a saved answer resolves only its exact registered image tuple in the same visible article section", () => {
  const alias: ProductionMediaAlias = { locale: "en", articleId: "navigation", sectionId: "walkthrough",
    id: "navigation-old", src: "/falcon/docs/2026-09/navigation-old.jpg",
    currentId: "navigation-production", currentSrc: "/falcon/docs/2026-11/navigation-production.jpg" };
  const canonical = { id: alias.currentId, src: alias.currentSrc, title: "Current", instruction: "Actual procedure", result: "Actual outcome", alt: "Current image" };
  const supplied = { id: alias.id, src: alias.src };
  const match = (article = alias.articleId, section = alias.sectionId, item = supplied, target = canonical) =>
    matchesProductionGuideMedia(article, section, item, target, [alias]);
  assert.equal(match(), true);
  assert.equal(match("another-article"), false); assert.equal(match(alias.articleId, "another-section"), false);
  assert.equal(match(alias.articleId, alias.sectionId, { ...supplied, id: alias.currentId }), false);
  assert.equal(match(alias.articleId, alias.sectionId, { ...supplied, src: alias.src + "?token=x" }), false);
  assert.equal(match(alias.articleId, alias.sectionId, supplied, { ...canonical, src: "/falcon/docs/2026-11-ru/navigation-production.jpg" }), false);
  assert.equal(matchesProductionGuideMedia(alias.articleId, alias.sectionId, supplied, canonical, []), false);
});
