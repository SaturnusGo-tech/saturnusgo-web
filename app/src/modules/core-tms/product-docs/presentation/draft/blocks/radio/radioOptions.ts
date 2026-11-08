import type { List, PhrasingContent } from "mdast";
import type { ContainerDirective } from "mdast-util-directive";

export const productDocRadioName = "falcon-radio";
export const maxRadioOptions = 20;

export function isProductDocRadio(node: { type: string; name?: string }) {
  return node.type === "containerDirective" && node.name === productDocRadioName;
}

function textOf(node: PhrasingContent): string {
  if ("value" in node) return node.value;
  if ("children" in node) return node.children.map(textOf).join("");
  if ("alt" in node) return node.alt ?? "";
  return "";
}

export function readRadioOptions(node: ContainerDirective) {
  const list = node.children.find((child): child is List => child.type === "list");
  const options = (list?.children ?? []).slice(0, maxRadioOptions).map((item) =>
    item.children.flatMap((child) => child.type === "paragraph" ? child.children.map(textOf) : []).join(""));
  const value = node.attributes?.selected;
  const index = value && /^\d+$/.test(value) ? Number(value) : -1;
  return { options, selected: index >= 0 && index < options.length ? index : -1 };
}

export function serializeRadioOptions(options: string[], selected: number): Pick<ContainerDirective, "children" | "attributes"> {
  return {
    attributes: selected >= 0 ? { selected: String(selected) } : {},
    children: [{
      type: "list", ordered: false, spread: false,
      children: options.map((value) => ({
        type: "listItem", spread: false,
        children: value ? [{ type: "paragraph", children: [{ type: "text", value }] }] : [],
      })),
    }],
  };
}
