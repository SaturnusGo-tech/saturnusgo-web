import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as lines from "../../../steps/support/scenarioLines";

const require = createRequire(import.meta.url);
function load(path: string) {
  const module = { exports: {} as Record<string, React.ComponentType<Record<string, unknown>>> };
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { module, exports: module.exports, require(name: string) {
    if (["react", "react/jsx-runtime", "lucide-react"].includes(name)) return require(name);
    if (name.endsWith(".css")) return { default: {} };
    if (name.endsWith("scenarioLines")) return lines;
    if (name.endsWith("ScenarioAttachments")) return {
      useScenarioAttachments: () => ({ pending: [], paste: () => false }),
      ScenarioAttachmentControls: () => null,
      PendingScenarioAttachments: () => null,
      SavedScenarioAttachments: ({ ids }: { ids?: string[] }) => React.createElement("div", {},
        ...((ids ?? []).map((id) => React.createElement("span", { key: id, "data-attachment": id }, id)))),
    };
    if (name.endsWith("ScenarioMarkdownInput")) return { ScenarioMarkdownInput: () => null };
    if (name.endsWith("ScenarioMarkdown")) return { ScenarioMarkdown: () => null };
    if (name.endsWith("ScenarioTextInput")) return { ScenarioTextInput: () => null };
    if (name.endsWith("StepActionMenu")) return { StepActionMenu: () => null };
    throw new Error(`Unexpected import ${name}`);
  } });
  return module.exports;
}

const Editor = load("../../../steps/editor/ScenarioStepEditor.tsx").ScenarioStepEditor;
const Viewer = load("../../../steps/viewer/ScenarioStepView.tsx").ScenarioStepView;
const step = { id: "step-1", action: "Открыть экран", expectedResult: "Экран открыт",
  testData: "", attachmentIds: ["photo-step-1", "pdf-step-1"] };

test("saved photo and file stay in their step when switching from viewing to editing", () => {
  const props = { step, order: 1, ru: true, sharedSteps: [], canRemove: false };
  for (const Component of [Viewer, Editor]) {
    const html = renderToStaticMarkup(React.createElement(Component, props));
    for (const id of step.attachmentIds) assert.equal(html.split(`data-attachment="${id}"`).length - 1, 1);
    const other = renderToStaticMarkup(React.createElement(Component, {
      ...props, step: { ...step, id: "step-2", attachmentIds: [] },
    }));
    assert.doesNotMatch(other, /data-attachment=/);
  }
});

test("shared-step editor keeps its supplied attachment controls without duplicating case evidence", () => {
  const html = renderToStaticMarkup(React.createElement(Editor, {
    step, order: 1, ru: true, sharedSteps: [], attachmentScope: "step",
    attachments: React.createElement("span", { "data-shared": true }, "shared attachment"),
  }));
  assert.match(html, /data-shared="true"/);
  assert.doesNotMatch(html, /data-attachment=/);
});
