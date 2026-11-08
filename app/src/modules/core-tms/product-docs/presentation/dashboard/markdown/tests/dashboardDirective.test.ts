import assert from "node:assert/strict";
import test from "node:test";
import type { LeafDirective } from "mdast-util-directive";
import { fromMarkdown } from "mdast-util-from-markdown";
import { directiveFromMarkdown } from "mdast-util-directive";
import { directive } from "micromark-extension-directive";
import { widgetCatalog } from "../../../../../dashboards/layout/model/widget-catalog";
import { editorMarkdownToSections, sectionsToEditorMarkdown } from "../../../draft/sections/productDocMarkdown";
import { dashboardDirectiveName, markProductDocDashboard } from "../dashboardDirective";

test("dashboard insertion and subsequent edits retain only the server capture ID in a document section", () => {
  const id = "dsh_307b2254-f756-4836-9957-8f43b356137a";
  const sections = [{
    id: "report", title: "Release report",
    markdown: `This month’s QA results.\n\n::falcon-dashboard{snapshot="${id}"}`,
  }];
  const serialized = sectionsToEditorMarkdown(sections);
  assert.deepEqual(editorMarkdownToSections(serialized, "fallback"), sections);
  const parsed = fromMarkdown(sections[0].markdown, {
    extensions: [directive()], mdastExtensions: [directiveFromMarkdown()],
  });
  const leaf = parsed.children[1];
  assert.equal(leaf.type, "leafDirective");
  if (leaf.type !== "leafDirective") return;
  assert.equal(markProductDocDashboard(leaf), true);
  assert.deepEqual(leaf.data?.hProperties, { snapshot: id });
  assert.equal(leaf.data?.hName, dashboardDirectiveName);
});

test("non-ID values never become dashboard requests", () => {
  const leaf: LeafDirective = {
    type: "leafDirective", name: dashboardDirectiveName, children: [], attributes: { snapshot: "https://somewhere.test" },
  };
  assert.equal(markProductDocDashboard(leaf), true);
  assert.deepEqual(leaf.data?.hProperties, { snapshot: "" });
});

test("dashboard picker uses each of the 29 native widget definitions", () => {
  assert.equal(widgetCatalog.length, 29);
  assert.equal(new Set(widgetCatalog.map((widget) => widget.key)).size, 29);
  assert.ok(widgetCatalog.every((widget) => widget.en && widget.ru && widget.hintEn && widget.hintRu));
});
