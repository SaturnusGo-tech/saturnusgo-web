import TurndownService from "turndown";

const converter = new TurndownService({
  headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced",
  emDelimiter: "*", preformattedCode: true,
});

converter.addRule("codePayload", {
  filter: "pre",
  replacement: (_content, node) => {
    const code = node.querySelector("code");
    const text = (code ?? node).textContent ?? "";
    const language = code?.className.match(/(?:^|\s)language-([\w+-]+)/)?.[1] ?? "";
    const fence = "`".repeat(Math.max(2, ...(text.match(/`+/g) ?? []).map((run) => run.length)) + 1);
    return `\n\n${fence}${language}\n${text}${text.endsWith("\n") ? "" : "\n"}${fence}\n\n`;
  },
});
converter.addRule("strike", { filter: ["del", "s"], replacement: (text) => `~~${text}~~` });
converter.addRule("safeLink", {
  filter: "a",
  replacement: (text, node) => {
    const href = node.getAttribute("href") ?? "";
    if (!/^(https?:|mailto:|tel:|#)/i.test(href)) return text;
    return `[${text}](<${href.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s/g, encodeURIComponent)}>)`;
  },
});
converter.addRule("imageLabel", {
  filter: "img", replacement: (_text, node) => node.getAttribute("alt") ?? "",
});
converter.addRule("table", {
  filter: "table",
  replacement: (_text, node) => {
    const rows = Array.from(node.querySelectorAll("tr")).filter((row) => row.closest("table") === node);
    const cells = rows.map((row) => Array.from(row.children).map((cell) =>
      converter.turndown(cell as HTMLElement).replace(/\|/g, "\\|").replace(/\n+/g, " ").trim()));
    const width = Math.max(0, ...cells.map((row) => row.length));
    if (!width) return "";
    const line = (row: string[]) => `| ${Array.from({ length: width }, (_, i) => row[i] ?? "").join(" | ")} |`;
    const hasHeader = rows[0]?.querySelector("th");
    const header = hasHeader ? cells.shift()! : Array<string>(width).fill("");
    return `\n\n${[line(header), line(Array<string>(width).fill("---")), ...cells.map(line)].join("\n")}\n\n`;
  },
});
converter.addRule("discardNonContent", {
  filter: (node) => /^(SCRIPT|STYLE|NOSCRIPT|IFRAME|OBJECT|BUTTON|SVG|INPUT|TEMPLATE)$/.test(node.nodeName)
    || node.hasAttribute("hidden") || node.getAttribute("aria-hidden") === "true",
  replacement: () => "",
});

/** Convert source structure, never infer or rewrite the meaning of test instructions. */
export function clipboardMarkdown(html: string, plain: string): string | null {
  if (!html || html.length > 1_000_000) return null;
  try {
    // A template is inert: pasted images/scripts never enter the live page.
    let source: string | DocumentFragment = html;
    if (typeof document !== "undefined") {
      const template = document.createElement("template");
      template.innerHTML = html;
      source = template.content;
    }
    const result = converter.turndown(source);
    return result.trim() ? result : plain || null;
  } catch { return null; } // Native plain-text paste remains available on unsupported input.
}
