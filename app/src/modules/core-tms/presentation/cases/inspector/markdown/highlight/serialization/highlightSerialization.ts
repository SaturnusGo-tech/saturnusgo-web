import { directiveFromMarkdown, directiveToMarkdown } from "mdast-util-directive";
import { normalizeMarkerLinks } from "./highlightLinks";
import type { Options } from "mdast-util-to-markdown";

/** Prevent GFM from re-tokenizing text inside a directive nested in a link label.
 * The ordinary parser decodes these escapes once, preserving URL text and its destination.
 * This also composes with MDXEditor's == highlight extension, which escapes '=' in text.
 */
export function highlightToMarkdown(): Options {
  const directives = directiveToMarkdown();
  return { ...directives, unsafe: [...directives.unsafe ?? [],
    { character: ":", before: "https?", after: "//", inConstruct: ["textDirectiveLabel"] },
    { character: ".", before: "[Ww][Ww][Ww]", after: "[A-Za-z0-9]", inConstruct: ["textDirectiveLabel"] },
    { character: "@", inConstruct: ["textDirectiveLabel"] },
  ] };
}


export function highlightFromMarkdown() {
  const directives = directiveFromMarkdown();
  return { ...directives, transforms: [...directives.transforms ?? [], normalizeMarkerLinks] };
}
