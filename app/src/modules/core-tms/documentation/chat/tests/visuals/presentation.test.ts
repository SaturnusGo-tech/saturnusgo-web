import assert from "node:assert/strict";
import { test } from "node:test";
import type { GuideVisuals } from "../../presentation/visuals/GuideVisuals";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { guideChatCopy } from "../../localization/copy";
import type { VisibleGuideVisual } from "../../model/visuals/visible-visuals";
import { visibleGuideVisuals } from "../../model/visuals/visible-visuals";
import type { GuideMessage } from "../../presentation/messages/GuideMessage";
import { documentationCatalog } from "../../../localization/catalog/locale-catalog";
import { documentationSectionMedia } from "../../../model/visual/guide-media";
import { historyContent } from "../../model/context/history-content";
import type { GuideVisual } from "../../model/conversation";

test("gallery is a keyboard reachable scroll region and opens the existing guide image viewer", () => {
  const h = componentHarness();
  const { GuideVisuals: render } = h.load<{ GuideVisuals: typeof GuideVisuals }>(new URL("../../presentation/visuals/GuideVisuals.tsx", import.meta.url), name =>
    name.endsWith("useDocumentationCopy") ? { useDocumentationCopy: () => ({ enlargeScreenshot: "Enlarge screenshot" }) } : undefined);
  const visual: VisibleGuideVisual = { key: "a:s", articleId: "a", sectionId: "s", title: "A procedure", layout: "gallery",
    steps: Array.from({ length: 6 }, (_, index) => ({ id: `image-${index}`, title: `Step ${index + 1}`, instruction: "Follow the actual procedure", result: "Expected outcome",
      image: { src: `/falcon/docs/2026-09/step-${index}.jpg`, alt: `Actual screenshot ${index + 1}`, width: 1440, height: 900 } })) };
  const all = () => nodes(h.render(() => render({ visual, copy: guideChatCopy.en })));
  const region = all().find(node => node.props.role === "region")!;
  assert.equal(region.props.tabIndex, 0); assert.match(String(region.props["aria-label"]), /Scroll horizontally/);
  const images = all().filter(node => node.type === "img"); assert.equal(images.length, 6);
  assert.equal(images[0].props.width, 1440); assert.equal(images[0].props.height, 900);
  assert.equal((images[0].props.style as { aspectRatio: string }).aspectRatio, "1440 / 900");
  const buttons = all().filter(node => node.props["aria-haspopup"] === "dialog");
  assert.equal(buttons[1].props["aria-label"], "Enlarge screenshot 2: Step 2"); invoke(buttons[1], "onClick");
  let viewer = all().find(node => node.type === "ScreenshotDialog")!;
  assert.equal(viewer.props.selected, 1); assert.equal((viewer.props.steps as unknown[]).length, 6);
  invoke(viewer, "onSelect", null); viewer = all().find(node => node.type === "ScreenshotDialog")!; assert.equal(viewer.props.selected, null);
  visual.layout = "steps";
  assert.equal(all().filter(node => node.type === "img").length, 6);
  assert.equal(all().some(node => node.props["aria-expanded"] !== undefined), false);
});

test("all seven images across 5+2 sections match follow-up positions and the shared image viewer", () => {
  const catalog = documentationCatalog("en", false), h = componentHarness();
  const group = (articleId: string, count: number): GuideVisual => {
    const article = catalog.articleById.get(articleId)!;
    const section = article.sections.find(value => documentationSectionMedia(value).length >= count)!;
    return { articleId, sectionId: section.id, layout: "steps", items: documentationSectionMedia(section).slice(0, count) };
  };
  const message = { role: "assistant" as const, content: "Follow these steps.", visuals: [group("workspace", 5), group("portfolios", 2)] };
  const { GuideMessage: renderMessage } = h.load<{ GuideMessage: typeof GuideMessage }>(new URL("../../presentation/messages/GuideMessage.tsx", import.meta.url), name => {
    if (name.endsWith("useDocumentationCatalog")) return { useDocumentationCatalog: () => catalog };
    if (name.endsWith("localization/copy")) return { guideChatCopy };
    if (name.endsWith("citations")) return { visibleCitations: () => [] };
    if (name.endsWith("visible-visuals")) return { visibleGuideVisuals };
  });
  const groups = nodes(h.render(() => renderMessage({ message, navigation: {} as never, onSource() {} }))).filter(node => node.type === "GuideVisuals");
  assert.equal(groups.length, 2);
  const rendered = groups.map(node => {
    const groupHarness = componentHarness();
    const { GuideVisuals: render } = groupHarness.load<{ GuideVisuals: typeof GuideVisuals }>(new URL("../../presentation/visuals/GuideVisuals.tsx", import.meta.url), name =>
      name.endsWith("useDocumentationCopy") ? { useDocumentationCopy: () => ({ enlargeScreenshot: "Enlarge screenshot" }) } : undefined);
    const all = () => nodes(groupHarness.render(() => render(node.props as Parameters<typeof render>[0])));
    return { all };
  });
  const images = rendered.flatMap(group => group.all().filter(node => node.type === "img"));
  const buttons = rendered.flatMap(group => group.all().filter(node => node.props["aria-haspopup"] === "dialog"));
  assert.equal(images.length, 7);
  assert.deepEqual(rendered.map(group => group.all().find(node => node.type === "ol")!.props.start), [1, 6]);
  assert.deepEqual(buttons.map(node => Number(String(node.props["aria-label"]).match(/screenshot (\d+):/)?.[1])), [1, 2, 3, 4, 5, 6, 7]);
  const history = historyContent(message, 8000, catalog.articleById), marker = "[Displayed guide images: context only]\n";
  const metadata = JSON.parse(history.slice(history.indexOf(marker) + marker.length, history.lastIndexOf("\n[/Displayed guide images]"))) as { position: number; mediaId: string }[];
  const expected = visibleGuideVisuals(message.visuals, catalog.articleById).flatMap(group => group.steps);
  assert.deepEqual(images.map(node => node.props.src), expected.map(step => step.image.src));
  assert.deepEqual(metadata.map(item => item.position), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(metadata.map(item => item.mediaId), expected.map(step => step.id));
  invoke(buttons[5], "onClick");
  let viewer = rendered[1].all().find(node => node.type === "ScreenshotDialog")!;
  assert.equal(viewer.props.selected, 5); assert.equal((viewer.props.steps as unknown[]).length, 7);
  invoke(viewer, "onSelect", 4); viewer = rendered[1].all().find(node => node.type === "ScreenshotDialog")!;
  assert.equal(viewer.props.selected, 4);
  invoke(viewer, "onSelect", null); assert.equal(rendered[1].all().find(node => node.type === "ScreenshotDialog")!.props.selected, null);
});
