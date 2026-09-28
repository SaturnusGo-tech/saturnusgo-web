import assert from "node:assert/strict";
import { test } from "node:test";
import type { GuideVisuals } from "../../presentation/visuals/GuideVisuals";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { guideChatCopy } from "../../localization/copy";
import type { VisibleGuideVisual } from "../../model/visuals/visible-visuals";

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
  assert.equal(all().filter(node => node.type === "img").length, 4);
  const more = all().find(node => node.type === "button" && node.props["aria-expanded"] === false)!;
  invoke(more, "onClick"); assert.equal(all().filter(node => node.type === "img").length, 6);
  assert.ok(all().find(node => node.type === "button" && node.props["aria-expanded"] === true));
});
