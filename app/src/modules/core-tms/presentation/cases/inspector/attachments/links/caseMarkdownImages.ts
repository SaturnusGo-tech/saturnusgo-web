import { fromMarkdown } from "mdast-util-from-markdown";
import type { Definition, Image, ImageReference, RootContent } from "mdast";
import type { TestCaseRevision } from "../../../../../../../core/tms/contracts/legacy-contract";

export function caseRevisionMarkdown(revision: TestCaseRevision) {
  return [
    revision.description, revision.preconditions, revision.testData,
    ...revision.checklist.map(item => item.text),
    ...revision.steps.flatMap(step => [
      step.action, step.expectedResult, step.testData,
      ...(step.sharedStep?.items.flatMap(item => [item.action, item.expectedResult, item.testData]) ?? []),
    ]),
  ];
}

export function caseMarkdownImages(sources: readonly (string | undefined)[]) {
  const links = new Map<string, { url: string; label: string }>();
  for (const source of sources) {
    if (!source?.includes("![")) continue;
    const stack: RootContent[] = [...fromMarkdown(source).children].reverse();
    const definitions = new Map<string, Definition>();
    const images: (Image | ImageReference)[] = [];
    while (stack.length) {
      const node = stack.pop()!;
      if (node.type === "image" || node.type === "imageReference") images.push(node);
      if (node.type === "definition" && !definitions.has(node.identifier)) definitions.set(node.identifier, node);
      if ("children" in node) stack.push(...[...node.children].reverse());
    }
    for (const image of images) {
      const raw = image.type === "image" ? image.url : definitions.get(image.identifier)?.url;
      if (!raw || !/^https?:\/\//i.test(raw)) continue;
      let url: URL;
      try { url = new URL(raw); } catch { continue; }
      if (url.username || url.password || links.has(url.href)) continue;
      links.set(url.href, { url: url.href, label: image.alt?.trim() || url.hostname });
    }
  }
  return [...links.values()];
}
