import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../markdown/MarkdownField.tsx", import.meta.url), "utf8");
const initialized = readFileSync(new URL("../markdown/InitializedMarkdownEditor.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../markdown/markdownField.module.css", import.meta.url), "utf8");
const globalStyles = readFileSync(new URL("../../../../../../shared/styles/globals.css", import.meta.url), "utf8");
const layoutStyles = readFileSync(new URL("../../cases.module.css", import.meta.url), "utf8");
const content = readFileSync(new URL("../CaseInspectorContent.tsx", import.meta.url), "utf8");
const details = readFileSync(new URL("../details/InspectorDetails.tsx", import.meta.url), "utf8");
const section = readFileSync(new URL("../section/InspectorSectionView.tsx", import.meta.url), "utf8");
const steps = readFileSync(new URL("../steps/InspectorSteps.tsx", import.meta.url), "utf8");
const select = readFileSync(new URL("../../../common/select/AnimatedSelect.tsx", import.meta.url), "utf8");
const modal = readFileSync(new URL("../../../common/modal/Modal.tsx", import.meta.url), "utf8");

test("markdown fields use a client-only WYSIWYG editor without a raw source pane", () => {
  assert.match(source, /dynamic\([\s\S]*ssr: false/);
  assert.match(initialized, /<MDXEditor/);
  assert.match(initialized, /BoldItalicUnderlineToggles options=\{\["Bold", "Italic"\]\}/);
  assert.match(initialized, /<ListsToggle \/>/);
  assert.doesNotMatch(initialized, /diffSourcePlugin|DiffSourceToggleWrapper/);
  assert.doesNotMatch(source, /preview="(?:edit|live)"/);
});

test("WYSIWYG and saved Markdown share safe HTML, link, and emphasis policies", () => {
  assert.match(initialized, /suppressHtmlProcessing/);
  assert.match(initialized, /stripRawHtml\(markdown\)/);
  assert.match(initialized, /safe !== props\.markdown\) props\.onChange\(safe\)/);
  assert.match(initialized, /linkPlugin\(\{ validateUrl: props\.validateUrl \}\)/);
  assert.match(source, /skipHtml/);
  assert.match(source, /isSafeUrl\(url\) \? url : ""/);
  assert.match(styles, /\.editorContent strong/);
  assert.match(styles, /\.editorContent em/);
  assert.match(styles, /font-weight: 750/);
  assert.match(styles, /color: var\(--cases-strong\) !important/);
});

test("portal-rendered block type options use a bounded themed popup", () => {
  assert.match(globalStyles, /html\[data-tms="1"\] \.mdxeditor-select-content/);
  assert.match(globalStyles, /max-height: min\(224px, var\(--radix-select-content-available-height\)\)/);
  assert.match(globalStyles, /overflow-y: auto/);
  assert.match(globalStyles, /scrollbar-gutter: stable/);
  assert.match(globalStyles, /html\.dark\[data-tms="1"\] \.mdxeditor-select-content/);
  assert.match(globalStyles, /\[role="option"\]\[data-highlighted\]/);
  assert.match(globalStyles, /\[role="option"\]\[data-state="checked"\]/);
  assert.match(globalStyles, /animation: tms-markdown-select-in/);
});

test("fullscreen inspector content keeps the normal full-width layout", () => {
  const fullscreenRule = layoutStyles.match(/\.detailPanelFullscreen \.detailTitle,[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(fullscreenRule, /width: 100%/);
  assert.match(fullscreenRule, /max-width: none/);
  assert.match(fullscreenRule, /margin-inline: 0/);
  assert.doesNotMatch(fullscreenRule, /1120px/);
  assert.doesNotMatch(layoutStyles, /detailPanelFullscreen \.facts/);
});

test("rich text is scoped to narrative test-case fields", () => {
  assert.match(content, /value=\{value\.description\}/);
  assert.match(content, /value=\{value\.preconditions\}/);
  assert.match(details, /value=\{revision\.testData\}/);
  assert.match(steps, /value=\{step\.action\}/);
  assert.doesNotMatch(content, /<MarkdownField[^>]+value=\{value\.component\}/s);
});

test("section snapshots and rich field labels remain interaction-safe", () => {
  assert.match(content, /if \(snapshots\.current\[section\]\) return/);
  assert.match(section, /!props\.persistentEditing && !active/);
  assert.match(details, /className=\{`\$\{css\.wideField\} \$\{css\.markdownControl\}`\}/);
  assert.match(steps, /className=\{css\.markdownControl\}/);
  const markdownInsideLabel = /<label[^>]*>(?:(?!<\/label>)[\s\S])*<MarkdownField/;
  assert.doesNotMatch(details, markdownInsideLabel);
  assert.doesNotMatch(steps, markdownInsideLabel);
});

test("a handled select Escape cannot close its containing modal", () => {
  assert.equal(select.match(/event\.stopPropagation\(\)/g)?.length, 2);
  assert.match(modal, /if \(event\.defaultPrevented\) return/);
});
