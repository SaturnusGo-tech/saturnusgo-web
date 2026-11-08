import assert from "node:assert/strict";
import test from "node:test";
import type { LeafDirective } from "mdast-util-directive";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { directive } from "micromark-extension-directive";
import { editorMarkdownToSections, sectionsToEditorMarkdown } from "../../../draft/sections/productDocMarkdown";
import { markProductDocRun, readRunEmbedPlacement, runDirectiveName, runEmbedPlacementAttributes, runSnapshotPattern } from "../runDirective";

const snapshot = "runembed_307b2254-f756-4836-9957-8f43b356137a";

test("run evidence round-trips as a standalone server snapshot reference", () => {
  const sections = [{
    id: "release", title: "Release evidence",
    markdown: `Before.\n\n::falcon-run{snapshot="${snapshot}"}\n\nAfter.`,
  }];
  assert.deepEqual(editorMarkdownToSections(sectionsToEditorMarkdown(sections), "fallback"), sections);
  const parsed = fromMarkdown(sections[0].markdown, {
    extensions: [directive()], mdastExtensions: [directiveFromMarkdown()],
  });
  const leaf = parsed.children[1];
  assert.equal(leaf.type, "leafDirective");
  if (leaf.type !== "leafDirective") return;
  assert.equal(markProductDocRun(leaf), true);
  assert.equal(leaf.data?.hName, runDirectiveName);
  assert.deepEqual(leaf.data?.hProperties, { snapshot });
  assert.deepEqual(parsed.children.map((node) => node.type), ["paragraph", "leafDirective", "paragraph"]);
});

test("arbitrary URLs and IDs are never read as run snapshots", () => {
  const leaf: LeafDirective = {
    type: "leafDirective", name: runDirectiveName, children: [],
    attributes: { snapshot: "https://example.test/run", runId: "run-456" },
  };
  assert.equal(runSnapshotPattern.test(snapshot), true);
  assert.equal(runSnapshotPattern.test("run-456"), false);
  assert.equal(markProductDocRun(leaf), true);
  assert.deepEqual(leaf.data?.hProperties, { snapshot: "" });
  assert.equal(markProductDocRun({ ...leaf, name: "falcon-dashboard" }), false);
});

test("run placement round-trips through the editor while retaining snapshot identity", () => {
  const parsed = fromMarkdown(`::falcon-run{snapshot="${snapshot}"}`, {
    extensions: [directive()], mdastExtensions: [directiveFromMarkdown()],
  });
  const leaf = parsed.children[0];
  assert.equal(leaf.type, "leafDirective");
  if (leaf.type !== "leafDirective") return;
  assert.deepEqual(readRunEmbedPlacement(leaf.attributes), {});
  leaf.attributes = runEmbedPlacementAttributes(leaf.attributes, { width: 64.6, align: "right" });
  const saved = toMarkdown(parsed, { extensions: [directiveToMarkdown()] });
  assert.match(saved, new RegExp(snapshot));
  const readBack = fromMarkdown(saved, { extensions: [directive()], mdastExtensions: [directiveFromMarkdown()] });
  const restored = readBack.children[0];
  assert.equal(restored.type, "leafDirective");
  if (restored.type !== "leafDirective") return;
  assert.equal(restored.attributes?.snapshot, snapshot);
  assert.deepEqual(readRunEmbedPlacement(restored.attributes), { width: 65, align: "right" });
  assert.equal(markProductDocRun(restored), true);
  assert.deepEqual(restored.data?.hProperties, { snapshot, width: 65, align: "right" });
  assert.deepEqual(runEmbedPlacementAttributes(restored.attributes, {}), { snapshot });
});

test("untrusted placement attrs only render bounded numeric width and supported alignment", () => {
  assert.deepEqual(readRunEmbedPlacement({ width: "1", align: "center" }), { width: 28, align: "center" });
  assert.deepEqual(readRunEmbedPlacement({ width: "200", align: "justify" }), { width: 100 });
  assert.deepEqual(readRunEmbedPlacement({ width: "4px; color:red", align: "" }), {});
});
