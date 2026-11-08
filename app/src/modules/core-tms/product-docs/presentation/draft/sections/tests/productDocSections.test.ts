import assert from "node:assert/strict";
import test from "node:test";
import { HeadingNode, $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import {
  $createParagraphNode, $createTextNode, $getRoot, $getState, $isParagraphNode,
  $setState, createEditor, SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
} from "lexical";
import { Realm } from "@mdxeditor/gurx";
import {
  addExportVisitor$, addToMarkdownExtension$, IS_BOLD, exportLexicalTreeToMdast, exportVisitors$, importMdastTreeToLexical, importVisitors$,
  rootEditor$,
} from "@mdxeditor/editor";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import { directive } from "micromark-extension-directive";
import { productDocFormattingPlugin } from "../../formatting/productDocFormatting";
import { remarkHighlights } from "../../../../../presentation/cases/inspector/markdown/highlight/render/remarkHighlights";
import { standardImport, standardExport } from "./standardProductDocVisitors";
import { ProductDocBoundaryNode } from "../nodes/ProductDocBoundaryNode";
import { sectionIdState } from "../nodes/sectionNodeState";
import { editorMarkdownToSections, escapeProductDocImportAnchors, productDocSectionsPlugin, sectionsToEditorMarkdown } from "../productDocSections";

test("one page preserves legacy heading depth, untitled section IDs and rich Markdown", () => {
  const input = [
    { id: "intro", title: "", markdown: "Introduction with **emphasis** and [policy](/docs/policy)." },
    { id: "linked", title: "Review [all] *requests*", markdown: [
      "## Legacy heading", "> Existing quotation", "- [x] Reviewed", "| A | B |\n| --- | --- |\n| 1 | 2 |",
      "![Preview](/guide.png)", ":::note\nDecision\n:::", "```text\n::falcon-product-doc-body{#example}",
    ].join("\n\n") },
    { id: "tail", title: "", markdown: "An old untitled section." },
  ];
  const result = editorMarkdownToSections(sectionsToEditorMarkdown(input), "new-intro");
  assert.deepEqual(result.map(({ id, title }) => ({ id, title })), input.map(({ id, title }) => ({ id, title })));
  assert.equal(result[0].markdown, input[0].markdown);
  assert.match(result[1].markdown, /## Legacy heading\n\n> Existing quotation\n\n\* \[x\] Reviewed/);
  assert.match(result[1].markdown, /\| 1 \| 2 \|/);
  assert.match(result[1].markdown, /!\[Preview\]\(\/guide\.png\)/);
  assert.match(result[1].markdown, /:::note\nDecision\n:::/);
  assert.match(result[1].markdown, /```text\n::falcon-product-doc-body\{#example\}\n```/);
  assert.equal(result[2].markdown, input[2].markdown);
});

test("a new document with plain text receives the caller's stable introduction anchor", () => {
  assert.deepEqual(editorMarkdownToSections("Just start writing.", "first-paragraph"), [
    { id: "first-paragraph", title: "", markdown: "Just start writing." },
  ]);
  assert.deepEqual(editorMarkdownToSections("", "first-paragraph"), []);
});

test("a marked section heading stays plain for links and keeps its marker for reading and re-editing", () => {
  const first = {
    id: "linked",
    title: "When booking closes",
    titleHighlights: [{ start: 5, end: 12, color: "green" as const }],
    markdown: "The hold expires.",
  };
  const editor = sectionsToEditorMarkdown([first]);
  assert.match(editor, /## When :highlight\[booking\]\{color="green"\} closes/);
  assert.deepEqual(editorMarkdownToSections(editor, "intro"), [first]);
});

test("imported Markdown cannot assign a section ID and preserves the same syntax in code", () => {
  const marker = "::falcon-product-doc-heading{#linked}";
  const body = "::falcon-product-doc-body{#old-intro}";
  const source = `${marker}\n\n## Look-alike heading\n\n${body}\n\n\`\`\`md\n${marker}\n\`\`\``;
  const escaped = escapeProductDocImportAnchors(source);
  const sections = editorMarkdownToSections(escaped, "new-intro");
  assert.deepEqual(sections.map(({ id }) => id), ["new-intro"]);
  assert.equal(escaped, source.replace(marker, `\\:\\:${marker.slice(2)}`).replace(body, `\\:\\:${body.slice(2)}`));
});

test("editing a pinned heading retains its ID and copying it gives the copy a new ID", () => {
  const realm = new Realm();
  productDocSectionsPlugin().init?.(realm);
  realm.pub(addExportVisitor$, standardExport);
  realm.pub(addToMarkdownExtension$, directiveToMarkdown());
  const editor = createEditor({ nodes: [HeadingNode, ProductDocBoundaryNode], onError: (error) => { throw error; } });
  realm.pub(rootEditor$, editor);
  const input = sectionsToEditorMarkdown([
    { id: "anonymous", title: "", markdown: "First paragraph." },
    { id: "linked", title: "Old title", markdown: "Body text." },
  ]);

  editor.update(() => {
    importMdastTreeToLexical({ root: $getRoot(), mdastRoot: fromMarkdown(input, {
      extensions: [directive()], mdastExtensions: [directiveFromMarkdown()],
    }), visitors: [...realm.getValue(importVisitors$), ...standardImport],
    jsxComponentDescriptors: [], directiveDescriptors: [], codeBlockEditorDescriptors: [] });
    const boundary = $getRoot().getFirstChildOrThrow();
    assert.ok(boundary instanceof ProductDocBoundaryNode);
    const heading = $getRoot().getChildren().find($isHeadingNode);
    assert.ok($isHeadingNode(heading));
    assert.equal($getState(heading, sectionIdState), "linked");
    heading.clear().append($createTextNode("Renamed "), $createTextNode("title").toggleFormat("bold"));
    const pasted = $setState($createHeadingNode("h2"), sectionIdState, "linked").append($createTextNode("A copy"));
    editor.dispatchCommand(SELECTION_INSERT_CLIPBOARD_NODES_COMMAND, { nodes: [pasted], selection: $getRoot().selectStart() });
    heading.insertBefore(pasted);
    $getRoot().append($createHeadingNode("h2").append($createTextNode("New rule")));
  }, { discrete: true });

  const sections = editor.getEditorState().read(() => {
    const output = toMarkdown(exportLexicalTreeToMdast({ root: $getRoot(),
      visitors: realm.getValue(exportVisitors$), jsxComponentDescriptors: [], jsxIsAvailable: false,
    }), { extensions: [directiveToMarkdown()] });
    assert.match(output, /## Renamed \*\*title\*\*/);
    return editorMarkdownToSections(output, "new-intro");
  });
  assert.deepEqual(sections.map(({ title }) => title), ["", "A copy", "Renamed title", "New rule"]);
  assert.deepEqual(sections[0], { id: "anonymous", title: "", markdown: "First paragraph." });
  assert.equal(sections[2].id, "linked");
  assert.equal(sections[2].markdown, "Body text.");
  assert.equal(new Set(sections.map(({ id }) => id)).size, 4);
});

test("paragraph alignment and text tones round-trip with inline formatting and existing section IDs", () => {
  const realm = new Realm();
  productDocSectionsPlugin().init?.(realm);
  productDocFormattingPlugin().init?.(realm);
  realm.pub(addExportVisitor$, standardExport);
  realm.pub(addToMarkdownExtension$, directiveToMarkdown());
  const editor = createEditor({ nodes: [HeadingNode, ProductDocBoundaryNode], onError: (error) => { throw error; } });
  realm.pub(rootEditor$, editor);
  const input = sectionsToEditorMarkdown([{
    id: "rule", title: "Review", markdown: ':::falcon-align{mode="center"}\nA :falcon-color[:falcon-underline[:highlight[**highlight**]{color="yellow"}]]{tone="danger"} here.\n:::\n\n:falcon-color[No style]{tone="external-url"}',
  }]);

  editor.update(() => {
    importMdastTreeToLexical({
      root: $getRoot(), mdastRoot: fromMarkdown(input, {
        extensions: [directive()], mdastExtensions: [directiveFromMarkdown()],
      }), visitors: [...realm.getValue(importVisitors$), ...standardImport, {
        testNode: "strong", visitNode({ mdastNode, lexicalParent, actions }) {
          if (mdastNode.type !== "strong") return;
          actions.addFormatting(IS_BOLD);
          actions.visitChildren(mdastNode, lexicalParent);
        },
      }, {
        priority: 1, testNode: "text", visitNode({ mdastNode, actions }) {
          if (mdastNode.type === "text") actions.addAndStepInto($createTextNode(mdastNode.value)
            .setFormat(actions.getParentFormatting()).setStyle(actions.getParentStyle()));
        },
      }], jsxComponentDescriptors: [], directiveDescriptors: [], codeBlockEditorDescriptors: [],
    });
    const paragraphs = $getRoot().getChildren().filter($isParagraphNode);
    assert.equal(paragraphs[0].getFormatType(), "center");
    const [, highlight] = paragraphs[0].getAllTextNodes();
    assert.equal(highlight.getTextContent(), "highlight");
    assert.match(highlight.getStyle(), /color: var\(--falcon-danger\);/);
    assert.match(highlight.getStyle(), /--falcon-marker: yellow;/);
    assert.ok(highlight.hasFormat("bold"));
    assert.ok(highlight.hasFormat("underline"));
    assert.equal(paragraphs[1].getAllTextNodes()[0].getStyle(), "");
    const line = $createTextNode(" Plain underline tail");
    paragraphs[1].append(line);
    line.select(7, 16).formatText("underline");
    paragraphs[0].setFormat("right");
  }, { discrete: true });

  const sections = editor.getEditorState().read(() => {
    const output = toMarkdown(exportLexicalTreeToMdast({
      root: $getRoot(), visitors: realm.getValue(exportVisitors$), jsxComponentDescriptors: [], jsxIsAvailable: false,
    }), { extensions: [directiveToMarkdown()] });
    return editorMarkdownToSections(output, "intro");
  });
  assert.equal(sections[0].id, "rule");
  assert.match(sections[0].markdown, /:::falcon-align\{mode="right"\}/);
  assert.match(sections[0].markdown, /A :highlight\[:falcon-color\[:falcon-underline\[\*\*highlight\*\*\]\]\{tone="danger"\}\]\{color="yellow"\} here\./);
  assert.match(sections[0].markdown, /Plain :falcon-underline\[underline\] tail/);
  assert.match(sections[0].markdown, /No style/);
  assert.doesNotMatch(sections[0].markdown, /external-url|<span/);
});

test("reader highlights a safe color while retaining document directives", () => {
  const tree = fromMarkdown(':::note\n:falcon-color[:highlight[Booking]{color="green"}]{tone="info"}\n\n:highlight[Invalid]{color="red"}\n:::', {
    extensions: [directive()], mdastExtensions: [directiveFromMarkdown()],
  });
  remarkHighlights({ preserveOtherDirectives: true })(tree);
  const note = tree.children[0];
  assert.equal(note.type, "containerDirective");
  const paragraph = note.children[0];
  assert.equal(paragraph.type, "paragraph");
  const tone = paragraph.children[0];
  assert.equal(tone.type, "textDirective");
  const mark = tone.children[0];
  assert.deepEqual(mark.data, { hName: "mark", hProperties: { "data-marker": "green" } });
  const invalid = note.children[1];
  assert.equal(invalid.type, "paragraph");
  assert.equal(invalid.children[0].type, "text");
});
