import type { Heading, PhrasingContent, RootContent } from "mdast";
import type { LeafDirective } from "mdast-util-directive";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmStrikethroughFromMarkdown, gfmStrikethroughToMarkdown } from "mdast-util-gfm-strikethrough";
import { gfmTableFromMarkdown, gfmTableToMarkdown } from "mdast-util-gfm-table";
import { gfmTaskListItemFromMarkdown, gfmTaskListItemToMarkdown } from "mdast-util-gfm-task-list-item";
import { toMarkdown } from "mdast-util-to-markdown";
import { toString } from "mdast-util-to-string";
import { directive } from "micromark-extension-directive";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { gfmTable } from "micromark-extension-gfm-table";
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item";
import type { ProductDocSection, ProductDocTitleHighlight } from "../../../domain/product-docs";
import { highlightColorOf, highlightedNode } from "../../../../presentation/cases/inspector/markdown/highlight/model/highlightSyntax";
import { highlightFromMarkdown, highlightToMarkdown } from "../../../../presentation/cases/inspector/markdown/highlight/serialization/highlightSerialization";
import { titleRuns, trimTitleHighlights } from "../title/model/productDocTitleHighlights";

const anchorNames = {
  heading: "falcon-product-doc-heading",
  body: "falcon-product-doc-body",
  literal: "falcon-product-doc-literal-heading",
} as const;

export type Anchor = { kind: "heading" | "body"; id: string } | { kind: "literal" };

export function anchorDirective(anchor: Anchor): LeafDirective {
  return { type: "leafDirective", name: anchorNames[anchor.kind],
    attributes: anchor.kind === "literal" ? {} : { id: anchor.id }, children: [] };
}

export function readAnchor(node: RootContent | undefined): Anchor | undefined {
  if (node?.type !== "leafDirective") return;
  if (node.name === anchorNames.literal) return { kind: "literal" };
  const id = node.attributes?.id;
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return;
  if (node.name === anchorNames.heading) return { kind: "heading", id };
  if (node.name === anchorNames.body) return { kind: "body", id };
}

function parse(markdown: string) {
  return fromMarkdown(markdown, {
    extensions: [directive(), gfmStrikethrough(), gfmTable(), gfmTaskListItem()],
    mdastExtensions: [highlightFromMarkdown(), gfmStrikethroughFromMarkdown(), gfmTableFromMarkdown(), gfmTaskListItemFromMarkdown()],
  });
}

function serialize(children: RootContent[]) {
  return toMarkdown({ type: "root", children }, {
    fences: true,
    extensions: [highlightToMarkdown(), gfmStrikethroughToMarkdown(), gfmTableToMarkdown(), gfmTaskListItemToMarkdown()],
  });
}

function isPrivateDirective(node: RootContent): node is LeafDirective {
  return node.type === "leafDirective" && Object.values(anchorNames).some((name) => name === node.name);
}

/** Treat private section markers in an imported file as literal text. */
export function escapeProductDocImportAnchors(markdown: string): string {
  const markers = parse(markdown).children.filter(isPrivateDirective);
  for (const marker of markers.reverse()) {
    const offset = marker.position?.start.offset;
    if (offset !== undefined) {
      markdown = markdown.slice(0, offset) + "\\:\\:" + markdown.slice(offset + 2);
    }
  }
  return markdown;
}

export async function readProductDocImport(file: File): Promise<string> {
  if (file.size > 131_072 || !/\.(?:md|markdown|txt)$/i.test(file.name)) throw new Error("Unsupported document import");
  const markdown = await file.text();
  if (!markdown.trim() || markdown.length > 32_768) throw new Error("Invalid document import size");
  return escapeProductDocImportAnchors(markdown);
}

function protectedBody(markdown: string): RootContent[] {
  return parse(markdown).children.flatMap<RootContent>((node) => {
    if (node.type === "heading" && node.depth <= 2) return [anchorDirective({ kind: "literal" }), node];
    if (isPrivateDirective(node)) {
      const { start, end } = node.position ?? {};
      return [{ type: "paragraph", children: [{ type: "text", value: markdown.slice(start?.offset, end?.offset) }] }];
    }
    return [node];
  });
}

function titlePhrasing(title: string, titleHighlights?: ProductDocTitleHighlight[]): PhrasingContent[] {
  return titleRuns(title, titleHighlights).map(({ text, color }) => {
    const node = { type: "text", value: text } as const;
    return color ? highlightedNode(color, [node]) : node;
  });
}

export function exportProductDocHeading(title: string, depth: 1 | 2, titleHighlights?: ProductDocTitleHighlight[]) {
  return titleHighlights?.length ? serialize([{ type: "heading", depth, children: titlePhrasing(title, titleHighlights) }]).trimEnd()
    : `${"#".repeat(depth)} ${title}`;
}

function readSectionTitle(heading: Heading) {
  let text = "";
  const marks: ProductDocTitleHighlight[] = [];
  function visit(node: PhrasingContent, color?: ProductDocTitleHighlight["color"]) {
    const marker = highlightColorOf(node) ?? color;
    if ("children" in node) {
      node.children.forEach((child) => visit(child, marker));
      return;
    }
    const start = text.length;
    text += toString(node);
    if (marker && text.length > start) marks.push({ start, end: text.length, color: marker });
  }
  heading.children.forEach((child) => visit(child));
  const titleHighlights = trimTitleHighlights(text, marks);
  return { title: text.trim(), ...(titleHighlights.length ? { titleHighlights } : {}) };
}

/** Private delimiters cross MDXEditor's Markdown bridge; persisted article bodies never include them. */
export function sectionsToEditorMarkdown(sections: readonly ProductDocSection[]): string {
  const blocks = sections.flatMap<RootContent>(({ id, title, markdown, titleHighlights }) => {
    const heading: Heading = { type: "heading", depth: 2, children: titlePhrasing(title, titleHighlights) };
    const opening = title ? [anchorDirective({ kind: "heading", id }), heading] : [anchorDirective({ kind: "body", id })];
    return [...opening, ...protectedBody(markdown)];
  });
  return serialize(blocks);
}

export function editorMarkdownToSections(markdown: string, introSectionId: string): ProductDocSection[] {
  const nodes = parse(markdown).children;
  const sections: ProductDocSection[] = [];
  const usedIds = new Set<string>();
  let current: Omit<ProductDocSection, "markdown"> & { explicit: boolean } = { id: introSectionId, title: "", explicit: false };
  let bodyStart = 0;
  let chunks: string[] = [];

  function collect(end: number) {
    chunks.push(markdown.slice(bodyStart, end).replace(/^[\r\n]+|[\r\n]+$/g, ""));
  }

  function finish(end: number) {
    collect(end);
    const body = chunks.filter((chunk) => chunk.trim()).join("\n\n");
    if (current.explicit || current.title || body) {
      const id = usedIds.has(current.id) ? crypto.randomUUID() : current.id;
      usedIds.add(id);
      const { explicit, ...section } = current;
      sections.push({ ...section, id, markdown: body });
    }
    chunks = [];
  }

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    const anchor = readAnchor(node);
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (!anchor || start === undefined || end === undefined) continue;
    const next = nodes[index + 1];
    if (anchor.kind === "literal") {
      collect(start);
      bodyStart = end;
    } else if (anchor.kind === "body") {
      finish(start);
      current = { id: anchor.id, title: "", explicit: true };
      bodyStart = end;
    } else if (next?.type === "heading") {
      finish(start);
      current = { id: anchor.id, ...readSectionTitle(next), explicit: true };
      bodyStart = next.position?.end.offset ?? end;
      index += 1;
    }
  }
  finish(markdown.length);
  return sections;
}
