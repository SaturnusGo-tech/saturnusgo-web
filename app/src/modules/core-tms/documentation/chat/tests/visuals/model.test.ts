import assert from "node:assert/strict";
import { test } from "node:test";
import { documentationCatalog } from "../../../localization/catalog/locale-catalog";
import { documentationSectionMedia } from "../../../model/visual/guide-media";
import { visibleGuideVisuals } from "../../model/visuals/visible-visuals";
import type { GuideVisual } from "../../model/conversation";
import { validateGuideAnswer } from "../../data/validate-answer";

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
