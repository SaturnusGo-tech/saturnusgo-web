import { fromMarkdown } from "mdast-util-from-markdown";
import type { RootContent } from "mdast";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import type { ProductDocScope, ProductDocSelection } from "../../../domain/product-docs";
import { readScopedProductDocLink } from "../../../navigation/product-doc-link";

function markdownLinks(source: string) {
  const definitions = new Map<string, string>();
  const links: Array<{ url: string } | { identifier: string }> = [];
  const stack: RootContent[] = [...fromMarkdown(source).children].reverse();
  while (stack.length) {
    const node = stack.pop()!;
    if (node.type === "definition") {
      if (!definitions.has(node.identifier)) definitions.set(node.identifier, node.url);
    } else if (node.type === "link" || node.type === "linkReference") {
      links.push(node);
    } else if (node.type === "text") {
      for (const url of node.value.match(/https?:\/\/[^\s<>()\[\]{}"'`]+/gi) ?? []) {
        links.push({url: url.replace(/[.,:;!?]+$/, "")});
      }
    } else if ("children" in node) {
      stack.push(...[...node.children].reverse());
    }
  }
  return links.flatMap(link => "url" in link ? [link.url] : definitions.get(link.identifier) ?? []);
}

export function pastedCaseDocLinks(revision: TestCaseRevision, href: string, scope: ProductDocScope) {
  const fields = [
    revision.description, revision.preconditions, revision.testData,
    ...revision.steps.filter(step => !step.sharedStepId && !step.sharedStep)
      .flatMap(step => [step.action, step.expectedResult, step.testData]),
    ...revision.checklist.map(item => item.text),
    revision.changeNote,
  ];
  const result = new Map<string, ProductDocSelection>();
  for (const field of fields) {
    if (!field?.includes("docId")) continue;
    for (const url of markdownLinks(field)) {
      const selection = readScopedProductDocLink(url, href, scope);
      if (selection) result.set(JSON.stringify(selection), selection);
    }
  }
  return [...result.values()];
}
