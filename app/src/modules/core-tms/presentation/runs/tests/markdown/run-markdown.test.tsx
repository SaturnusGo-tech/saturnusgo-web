import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import { highlightRemarkPlugins } from "../../../cases/inspector/markdown/highlight/render/remarkHighlights";

const view = readFileSync(new URL("../../RunsView.tsx", import.meta.url), "utf8");

test("run narrative fields render the immutable snapshot through the repository Markdown component", () => {
  for (const field of ["description", "preconditions"]) {
    assert.match(view, new RegExp(`<MarkdownField value=\\{selectedItem\\.snapshot\\.${field} \\?\\? ""\\}`));
    assert.doesNotMatch(view, new RegExp(`<p>\\{selectedItem\\.snapshot\\.${field}`));
  }
  assert.match(view, /<ScenarioMarkdown value=\{result\?\.actualResult/);
});

test("multiline run preconditions retain adjacent marker colors, emphasis and nested lists", () => {
  const snapshot = Object.freeze({ preconditions: [
    "## Предусловия",
    "",
    '1. :highlight[**Актуальная сборка**]{color="blue"} :highlight[***Umbrella Home***]{color="yellow"}',
    "2. **Тестировщик может переключать:**",
    "   - светлую и тёмную тему",
    "   - сеть",
  ].join("\n") });
  const html = renderToStaticMarkup(<ReactMarkdown skipHtml remarkPlugins={highlightRemarkPlugins}>{snapshot.preconditions}</ReactMarkdown>);
  assert.match(html, /<h2>Предусловия<\/h2>/);
  assert.match(html, /<mark data-marker="blue"><strong>Актуальная сборка<\/strong><\/mark>/);
  assert.match(html, /<mark data-marker="yellow"><em><strong>Umbrella Home<\/strong><\/em><\/mark>/);
  assert.match(html, /<ol>/);
  assert.match(html, /<ul>/);
  assert.doesNotMatch(html, /:highlight\[/);
  assert.ok(snapshot.preconditions.includes(':highlight['));
});
