import assert from "node:assert/strict";
import test from "node:test";
import type { NarrativeField } from "../NarrativeField";
import type { MarkdownField } from "../../MarkdownField";
import { componentHarness, invoke, nodes, type Node } from "../../../../../../portfolios/tests/support/component-harness";

test("click-to-edit narratives hide the pencil but retain Done while editing", () => {
  const h = componentHarness();
  const { NarrativeField: View } = h.load<{ NarrativeField: typeof NarrativeField }>(new URL("../NarrativeField.tsx", import.meta.url), name =>
    name.endsWith("useTmsLocale") ? { useTmsLocale: () => ({ locale: "en" }) } : undefined);
  const props = { label: "Description", value: "Saved text", onChange() {}, hideEditButton: true };
  let all = nodes(h.render(() => View(props)));
  assert.equal(all.some(node => node.type === "button"), false);
  invoke(all.find(node => node.type === "MarkdownField")!, "onRequestEdit");
  all = nodes(h.render(() => View(props)));
  const done = all.find(node => node.type === "button")!;
  assert.equal(done.props["aria-label"], "Done: Description");
  assert.equal(typeof all.find(node => node.type === "MarkdownField")?.props.onChange, "function");
  invoke(done, "onClick");
  all = nodes(h.render(() => View(props)));
  assert.equal(all.some(node => node.type === "button"), false);
  assert.equal(all.find(node => node.type === "MarkdownField")?.props.onChange, undefined);
  all = nodes(h.render(() => View({ ...props, hideEditButton: false })));
  assert.equal(all.find(node => node.type === "button")?.props["aria-label"], "Edit: Description");
  all = nodes(h.render(() => View({ ...props, disabled: true })));
  assert.equal(all.find(node => node.type === "MarkdownField")?.props.onRequestEdit, undefined);
});

test("read-only Markdown editing supports Enter and Space without hijacking child links", () => {
  const h = componentHarness(); let edits = 0, prevented = 0;
  const { MarkdownField: View } = h.load<{ MarkdownField: typeof MarkdownField }>(new URL("../../MarkdownField.tsx", import.meta.url), name => {
    if (name === "next/dynamic") return { default: () => "MarkdownEditor" };
    if (name === "@uiw/react-md-editor/nohighlight") return { default: { Markdown: "Markdown" } };
    if (name.endsWith("useColorMode")) return { useColorMode: () => ({ theme: "dark" }) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("CaseAttachmentDraftContext")) return { useCaseAttachmentDraft: () => undefined };
    if (name.endsWith("remarkHighlights")) return { highlightRemarkPlugins: [] };
  });
  const render = (editable = true) => {
    const element = View({ label: "Description", value: "Saved text", editOnKeyboard: true, onRequestEdit: editable ? () => { edits++; } : undefined });
    return h.render(() => (element.type as (props: unknown) => Node)(element.props));
  };
  const region = render();
  assert.equal(region.props.role, "button");
  assert.equal(region.props.tabIndex, 0);
  const target = {};
  for (const key of ["Enter", " "]) invoke(region, "onKeyDown", { key, target, currentTarget: target, preventDefault() { prevented++; } });
  assert.equal(edits, 2); assert.equal(prevented, 2);
  invoke(region, "onKeyDown", { key: "Enter", target: {}, currentTarget: target, preventDefault() { prevented++; } });
  assert.equal(edits, 2);
  assert.equal(render(false).props.tabIndex, undefined);
  assert.equal(render(false).props.role, undefined);
});
