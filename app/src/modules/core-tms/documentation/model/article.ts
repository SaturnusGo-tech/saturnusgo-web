import type { WalkthroughBlock } from "./visual/walkthrough";

export type DocBlock =
  | WalkthroughBlock
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "steps"; items: { title: string; text: string }[] }
  | { kind: "callout"; tone: "note" | "warning" | "success"; title: string; text: string }
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "code"; language: string; text: string; caption: string }
  | { kind: "articles"; ids: string[] };

export type DocSection = { id: string; title: string; blocks: DocBlock[] };
export type DocArticle = {
  id: string;
  title: string;
  description: string;
  group: string;
  keywords: string[];
  sections: DocSection[];
  related: string[];
  status?: "planned";
  sources?: { title: string; url: string }[];
};

export const paragraph = (text: string): DocBlock => ({ kind: "paragraph", text });
export const bullets = (...items: string[]): DocBlock => ({ kind: "list", items });
export const steps = (...items: [string, string][]): DocBlock => ({ kind: "steps", items: items.map(([title, text]) => ({ title, text })) });
export const note = (title: string, text: string): DocBlock => ({ kind: "callout", tone: "note", title, text });
export const warning = (title: string, text: string): DocBlock => ({ kind: "callout", tone: "warning", title, text });
export const success = (title: string, text: string): DocBlock => ({ kind: "callout", tone: "success", title, text });
export const table = (columns: string[], ...rows: string[][]): DocBlock => ({ kind: "table", columns, rows });
export const code = (language: string, caption: string, text: string): DocBlock => ({ kind: "code", language, caption, text });
export const articles = (...ids: string[]): DocBlock => ({ kind: "articles", ids });
export const section = (id: string, title: string, ...blocks: DocBlock[]): DocSection => ({ id, title, blocks });
