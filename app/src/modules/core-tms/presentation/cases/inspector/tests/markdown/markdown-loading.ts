import assert from "node:assert/strict";
import { componentHarness, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { MarkdownField } from "../../markdown/MarkdownField";
export async function assertLazyMarkdownLoading() {
  const h = componentHarness(); let imports = 0; let mountEditor!: () => Promise<unknown>;
  const component = h.load<{ MarkdownField: typeof MarkdownField }>(new URL("../../markdown/MarkdownField.tsx", import.meta.url), (name) => {
    if (name === "next/dynamic") return { default: (loader: () => Promise<unknown>, options: { ssr: boolean; loading: unknown }) => {
      assert.equal(options.ssr, false); assert.equal(typeof options.loading, "function");
      mountEditor = () => loader(); return mountEditor;
    } };
    if (name === "@uiw/react-md-editor/nohighlight") return { default: { Markdown: "RenderedMarkdown" } };
    if (name.endsWith("useColorMode")) return { useColorMode: () => ({ theme: "dark" }) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru" }) };
    if (name.endsWith("CaseAttachmentDraftContext")) return { useCaseAttachmentDraft: () => undefined };
    if (name.endsWith("InitializedMarkdownEditor")) { imports++; throw new Error("Chunk unavailable"); }
  });
  const props = { label: "Description", value: "**Safe** <script>alert(1)</script>" };
  const readOnly = nodes(h.render(() => component.MarkdownField(props)));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(imports, 0); assert.equal(readOnly.some((node) => (node.type as unknown) === mountEditor), false);
  const markdown = readOnly.find((node) => node.type === "RenderedMarkdown")!;
  assert.equal(markdown.props.skipHtml, true);
  assert.equal((markdown.props.urlTransform as (value: string) => string)("javascript:alert(1)"), "");
  const editing = nodes(h.render(() => component.MarkdownField({ ...props, onChange() {} })));
  assert.equal(editing.some((node) => (node.type as unknown) === mountEditor), true);
  await assert.rejects(mountEditor(), /Chunk unavailable/); assert.equal(imports, 1);
  h.dispose();
}
