import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  duplicateStepAfter, emptyScenarioStep, insertStepAfter, sharedScenarioStep,
} from "../../steps/stepOperations";

const menu = readFileSync(new URL("../../steps/menu/StepActionMenu.tsx", import.meta.url), "utf8");
const menuCss = readFileSync(new URL("../../steps/menu/stepActionMenu.module.css", import.meta.url), "utf8");
const scenarioCss = readFileSync(new URL("../../steps/scenarioSteps.module.css", import.meta.url), "utf8");
const sharedEditor = readFileSync(new URL("../../../../shared-steps/SharedStepEditor.tsx", import.meta.url), "utf8");
const sharedCss = readFileSync(new URL("../../../../shared-steps/sharedSteps.module.css", import.meta.url), "utf8");
const media = readFileSync(new URL("../../../../../attachments/presentation/link/AttachmentMediaFrame.tsx", import.meta.url), "utf8");
const mediaCss = readFileSync(new URL("../../../../../attachments/presentation/link/attachmentMediaFrame.module.css", import.meta.url), "utf8");
const attachmentLink = readFileSync(new URL("../../../../../attachments/presentation/link/AttachmentLink.tsx", import.meta.url), "utf8");
const scenarioAttachments = readFileSync(new URL("../../steps/support/ScenarioAttachments.tsx", import.meta.url), "utf8");
const contextTab = readFileSync(new URL("../../../detail/tabs/CaseContextTab.tsx", import.meta.url), "utf8");

test("shared procedures are inserted as live references and ordered with regular steps", () => {
  const first = emptyScenarioStep(1);
  const shared = sharedScenarioStep(2, { id: "shared-auth", title: "Авторизация", revision: 3,
    items: [{ id: "item-1", order: 1, action: "Войти", expectedResult: "Главная открыта",
      testData: "", required: true, attachmentIds: [] }] });
  const result = insertStepAfter([first], 0, shared);

  assert.deepEqual(result.map(({ order }) => order), [1, 2]);
  assert.equal(result[1]?.sharedStepId, "shared-auth");
  assert.equal(result[1]?.sharedStep?.revision, 3);
});

test("duplicating a shared procedure creates a new case-step identity", () => {
  const shared = sharedScenarioStep(1, { id: "shared-auth", title: "Авторизация", revision: 1,
    items: [{ id: "item-1", order: 1, action: "Войти", expectedResult: "Открыто",
      testData: "", required: true, attachmentIds: ["attachment-1"] }] });
  const result = duplicateStepAfter([shared], 0);

  assert.equal(result.length, 2);
  assert.notEqual(result[0]?.id, result[1]?.id);
  assert.equal(result[1]?.sharedStepId, "shared-auth");
  assert.notEqual(result[0]?.sharedStep?.items, result[1]?.sharedStep?.items);
});

test("shared-step editing stays dense and does not expose nested shared procedures", () => {
  assert.match(sharedEditor, /allowSharedSteps=\{false\}/);
  assert.match(menu, /allowSharedSteps &&/);
  assert.match(scenarioCss, /padding: 1px 0 3px/);
  assert.match(scenarioCss, /\.nestedLine \{[^}]*margin-left: 43px/s);
  assert.doesNotMatch(scenarioCss, /\.viewGroup \+ \.viewGroup \{[^}]*border-top/s);
  assert.doesNotMatch(scenarioCss, /\.stepFooter/);
});

test("shared-step canvas and action menu use opaque integrated surfaces", () => {
  assert.match(sharedCss, /--cases-bg: var\(--ss-bg\)/);
  assert.match(sharedCss, /\.paper \{[^}]*background: transparent;[^}]*border: 0;[^}]*box-shadow: none/s);
  assert.match(menuCss, /background: var\(--cases-bg, #fff\)/);
});

test("scenario and attachment tabs render image and video evidence as media", () => {
  assert.match(attachmentLink, /presentation === "media" && \(isImage \|\| isVideo\)/);
  assert.match(scenarioAttachments, /presentation="media"/);
  assert.match(contextTab, /presentation="media" variant="gallery"/);
  assert.match(media, /<img src=\{source\} alt=\{name\}/);
  assert.match(media, /<video src=\{source\} controls/);
  assert.match(mediaCss, /object-fit: contain/);
});

test("media evidence has smooth disclosure and proportional pointer resizing", () => {
  assert.match(media, /startResize\("left", event\)/);
  assert.match(media, /startResize\("right", event\)/);
  assert.match(media, /aria-expanded=\{expanded\}/);
  assert.match(mediaCss, /grid-template-rows 190ms/);
  assert.match(mediaCss, /cursor: ew-resize/);
  assert.match(mediaCss, /width: 100%;[\s\S]*height: auto/);
});

test("step action menu stays inside the scenario edge and flips vertically", () => {
  assert.match(menu, /data-placement=\{placement\}/);
  assert.match(menu, /spaceAbove/);
  assert.match(menu, /spaceBelow/);
  assert.match(menuCss, /\.menu\[data-trigger="icon"\] \{ right: 0; left: auto/);
  assert.match(menuCss, /\.menu\[data-placement="top"\]/);
});
