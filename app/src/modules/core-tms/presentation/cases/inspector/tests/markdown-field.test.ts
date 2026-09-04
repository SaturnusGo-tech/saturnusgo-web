import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../markdown/MarkdownField.tsx", import.meta.url), "utf8");
const initialized = readFileSync(new URL("../markdown/InitializedMarkdownEditor.tsx", import.meta.url), "utf8");
const attachmentUi = readFileSync(new URL("../markdown/attachments/MarkdownAttachmentUi.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../markdown/markdownField.module.css", import.meta.url), "utf8");
const layoutStyles = readFileSync(new URL("../../cases.module.css", import.meta.url), "utf8");
const listingStyles = readFileSync(new URL("../../listing/caseListing.module.css", import.meta.url), "utf8");
const content = readFileSync(new URL("../CaseInspectorContent.tsx", import.meta.url), "utf8");
const creation = readFileSync(new URL("../creation/CaseCreationSections.tsx", import.meta.url), "utf8");
const detailPanel = readFileSync(new URL("../../detail/CaseDetailPanel.tsx", import.meta.url), "utf8");
const projectDialog = readFileSync(new URL("../../../dialogs/project/ProjectDialog.tsx", import.meta.url), "utf8");
const projectStyles = readFileSync(new URL("../../../dialogs/project/projectDialog.module.css", import.meta.url), "utf8");
const details = readFileSync(new URL("../details/InspectorDetails.tsx", import.meta.url), "utf8");
const section = readFileSync(new URL("../section/InspectorSectionView.tsx", import.meta.url), "utf8");
const steps = readFileSync(new URL("../steps/InspectorSteps.tsx", import.meta.url), "utf8");
const scenarioStep = readFileSync(new URL("../steps/editor/ScenarioStepEditor.tsx", import.meta.url), "utf8");
const scenarioInput = readFileSync(new URL("../steps/editor/ScenarioTextInput.tsx", import.meta.url), "utf8");
const comments = readFileSync(new URL("../../collaboration/comments/CaseCommentsTab.tsx", import.meta.url), "utf8");
const detailActions = readFileSync(new URL("../../detail/header/CaseDetailHeaderActions.tsx", import.meta.url), "utf8");
const select = readFileSync(new URL("../../../common/select/AnimatedSelect.tsx", import.meta.url), "utf8");
const modal = readFileSync(new URL("../../../common/modal/Modal.tsx", import.meta.url), "utf8");

test("markdown fields use a client-only WYSIWYG editor with an interactive loading fallback", () => {
  assert.match(source, /dynamic\([\s\S]*ssr: false/);
  assert.match(source, /loading: \(\) => <MarkdownEditorLoadingFallback/);
  assert.match(source, /void loadMarkdownEditor\(\)/);
  assert.match(source, /className=\{css\.editorLoadingInput\}/);
  assert.match(source, /value=\{state\.value\}/);
  assert.match(source, /onChange=\{\(event\) => state\.onChange\(event\.target\.value\)\}/);
  assert.match(styles, /\.editorLoadingInput/);
  assert.match(initialized, /const \[editorPainted, setEditorPainted\] = useState\(false\)/);
  assert.match(initialized, /stripRawHtml\(editor\?\.getMarkdown\(\) \?\? ""\)\.trim\(\)/);
  assert.match(initialized, /matchingFrames >= 2/);
  assert.match(initialized, /!editorPainted && <div className=\{`\$\{css\.editorLoading\} \$\{css\.editorBootOverlay\}/);
  assert.match(initialized, /value=\{props\.markdown\}/);
  assert.match(initialized, /onChange=\{\(event\) => props\.onChange\(event\.target\.value\)\}/);
  assert.match(styles, /\.editorBootOverlay \{ position: absolute; z-index: 3; inset: 0; \}/);
  assert.doesNotMatch(source, /editorLoading[^\n]*aria-hidden/);
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
  assert.match(styles, /font-weight: 600/);
  assert.match(styles, /color: var\(--cases-strong\) !important/);
});

test("case Markdown inputs attach or paste private files from the conventional lower-left position", () => {
  assert.match(initialized, /<ListsToggle \/><CreateLink \/>/);
  assert.match(initialized, /className=\{css\.editorFooter\}[\s\S]*<MarkdownAttachmentButton/);
  assert.match(attachmentUi, /<Paperclip size=\{15\} \/>/);
  assert.match(attachmentUi, /type="file" multiple/);
  assert.doesNotMatch(attachmentUi, /accept=/);
  assert.match(source, /onPasteCapture=\{\(event\)/);
  assert.match(source, /filesFromClipboard\(event\.clipboardData\)/);
  assert.match(source, /event\.preventDefault\(\);[\s\S]*addFiles\(files\)/);
  assert.match(content, /attachmentKey="description"/);
  assert.match(content, /attachmentKey="preconditions"/);
  assert.match(details, /attachmentKey="test-data"/);
  assert.match(steps, /fieldKey=\{`checklist:\$\{props\.id\}`\}/);
  assert.match(scenarioStep, /stepId=\{props\.step\.id\}/);
  assert.match(comments, /allowAttachments=\{false\}/);
});

test("Markdown link editing uses a themed modal layer with clear fields", () => {
  assert.match(initialized, /overlayContainer=\{overlayContainer \?\? undefined\}/);
  assert.match(initialized, /createLink\.text[\s\S]*Текст ссылки/);
  assert.match(initialized, /dialogControls\.save[\s\S]*Сохранить/);
  assert.match(styles, /\.wysiwyg:has\(form\)/);
  assert.match(styles, /place-items: center/);
  assert.match(styles, /\[role="dialog"\][\s\S]*background: var\(--cases-deep\)/);
  assert.match(styles, /\[role="dialog"\] input[\s\S]*min-height: 38px/);
});

test("Markdown inputs omit the disruptive block-type selector", () => {
  assert.doesNotMatch(initialized, /BlockTypeSelect/);
  assert.doesNotMatch(initialized, /toolbar\.blockTypes|blockTypeSelect/);
});

test("case chrome is quiet until the user asks to edit", () => {
  assert.match(detailActions, /Копировать ID/);
  assert.match(detailActions, /Копировать ссылку/);
  assert.match(detailActions, /На весь экран/);
  assert.match(detailActions, /MoreHorizontal/);
  assert.match(detailActions, /Создать копию/);
  assert.doesNotMatch(detailActions, /aria-label=\{ru \? "Клонировать"|SlidersHorizontal/);
  assert.doesNotMatch(detailPanel, /testCase\??\.folderPath/);
  assert.doesNotMatch(detailPanel, /className=\{inspector\.titleMark\}/);
  assert.match(comments, /!composerOpen[\s\S]*commentPrompt/);
  assert.match(comments, /compact[\s\S]*autoFocus/);
  assert.doesNotMatch(comments, /comments\.items\.length\}/);
  assert.match(listingStyles, /\.keyCell \{[\s\S]*color: var\(--cases-muted\) !important/);
  assert.match(listingStyles, /selectionModeButton\[aria-pressed="true"\][\s\S]*var\(--cases-on-primary\)/);
});

test("case content and properties use the TestOps-inspired two-column hierarchy", () => {
  assert.match(content, /overviewLayout/);
  assert.match(content, /<main className=\{css\.primaryColumn\}>[\s\S]*Описание[\s\S]*Предусловия[\s\S]*Сценарий/);
  assert.match(content, /<aside className=\{css\.sideRail\}[\s\S]*Расположение[\s\S]*Свойства[\s\S]*Дополнительно/);
  assert.match(content, /controls\("properties"\)[\s\S]*<CaseMetadataControls/);
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
  assert.doesNotMatch(steps, /MarkdownField/);
  assert.match(steps, /<ScenarioStepEditor/);
  assert.doesNotMatch(content, /<MarkdownField[^>]+value=\{value\.component\}/s);
});

test("section snapshots and rich field labels remain interaction-safe", () => {
  assert.match(content, /if \(snapshots\.current\[section\]\) return/);
  assert.match(section, /!props\.persistentEditing && !active/);
  assert.match(details, /className=\{`\$\{css\.wideField\} \$\{css\.markdownControl\}`\}/);
  const markdownInsideLabel = /<label[^>]*>(?:(?!<\/label>)[\s\S])*<MarkdownField/;
  assert.doesNotMatch(details, markdownInsideLabel);
  assert.doesNotMatch(scenarioStep, /MarkdownField/);
});

test("scenario editing is a clean hierarchical sheet instead of boxed Markdown fields", () => {
  assert.match(scenarioStep, /scenarioLineLabel\(props\.order, lineIndex\)/);
  assert.match(scenarioStep, /event\.key === "Enter"/);
  assert.match(scenarioStep, /insertScenarioLine/);
  assert.match(scenarioStep, /event\.key === "Backspace"/);
  assert.match(scenarioStep, /removeScenarioLine/);
  assert.match(scenarioStep, /Ожидаемый результат/);
  assert.match(scenarioStep, /ScenarioAttachmentControls/);
  assert.match(scenarioStep, /onPaste=\{actionAttachments\.paste\}/);
  assert.doesNotMatch(scenarioStep, /Обязательный шаг|Required step/);
  assert.match(scenarioInput, /rows=\{1\}/);
  assert.match(scenarioInput, /node\.scrollHeight/);
  assert.doesNotMatch(scenarioStep, /MarkdownField|MDXEditor/);
});

test("a handled select Escape cannot close its containing modal", () => {
  assert.equal(select.match(/event\.stopPropagation\(\)/g)?.length, 2);
  assert.match(modal, /if \(event\.defaultPrevented\) return/);
});

test("create mode shares the same calm two-column hierarchy and stable action bar", () => {
  assert.match(content, /creating && editor[\s\S]*<CaseCreationSections/);
  assert.match(creation, /css\.overviewLayout/);
  assert.match(creation, /<main className=\{css\.primaryColumn\}>[\s\S]*Описание[\s\S]*Предусловия[\s\S]*Сценарий/);
  assert.match(creation, /<aside className=\{css\.sideRail\}[\s\S]*Расположение[\s\S]*Свойства[\s\S]*Дополнительно/);
  assert.doesNotMatch(creation, /number=|creationTone_|<details/);
  assert.match(creation, /CreationNarrativeSection[\s\S]*section="description"/);
  assert.match(creation, /onChange=\{editing \? onChange : undefined\}/);
  assert.match(creation, /<InspectorSteps revision=\{revision\} editing/);
  assert.ok(detailPanel.lastIndexOf("</form>") < detailPanel.lastIndexOf("{creating && editorActions}"));
  assert.match(detailPanel, /!creating && editorActions/);
  assert.match(detailPanel, /!creating && <CaseDetailTabs/);
});

test("project dialog shares the guided form language without a detached footer", () => {
  assert.match(projectDialog, /panelClassName=\{styles\.panel\}/);
  assert.match(projectDialog, /identitySection/);
  assert.match(projectDialog, /setupSection/);
  assert.match(projectDialog, /<details className=\{styles\.optional\}/);
  assert.doesNotMatch(projectDialog, /snapshotNote|modalFooter/);
  assert.match(projectStyles, /\.actions[\s\S]*background: var\(--paper\)/);
});
