import type { DocArticle, DocBlock } from "./article";

export function blockText(block: DocBlock): string {
  switch (block.kind) {
    case "paragraph": case "code": return block.text;
    case "callout": return `${block.title} ${block.text}`;
    case "steps": return block.items.map((item) => `${item.title} ${item.text}`).join(" ");
    case "walkthrough": return `${block.title} ${block.steps.map((step) =>
      `${step.title} ${step.instruction} ${step.result} ${step.image.alt}`).join(" ")}`;
    case "list": return block.items.join(" ");
    case "table": return [block.columns, ...block.rows].flat().join(" ");
    case "articles": return "";
  }
}
const normalize = (text: string) => text.toLocaleLowerCase("ru").replaceAll("ё", "е").replace(/[**`]/g, "");
export const articleText = (article: DocArticle) => article.sections.map((s) => `${s.title} ${s.blocks.map(blockText).join(" ")}`).join(" ");
export const readingMinutes = (article: DocArticle) => Math.max(1, Math.ceil(articleText(article).split(/\s+/).length / 180));

export function searchArticles(articles: readonly DocArticle[], query: string) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return articles.map((article) => {
    const title = normalize(article.title), keywords = normalize(article.keywords.join(" "));
    const body = normalize(`${article.description} ${articleText(article)}`);
    const score = terms.reduce((total, term) => total + (title.includes(term) ? 10 : keywords.includes(term) ? 6 : body.includes(term) ? 1 : 0), 0);
    const matches = terms.every((term) => title.includes(term) || keywords.includes(term) || body.includes(term));
    const index = body.indexOf(terms[0]);
    const text = `${article.description} ${articleText(article)}`.replace(/[**`]/g, "");
    const start = Math.max(0, text.lastIndexOf(" ", Math.max(0, index - 55)) + 1);
    const limit = Math.min(text.length, start + 190);
    const boundary = limit < text.length ? text.lastIndexOf(" ", limit) : limit;
    const end = boundary > start ? boundary : limit;
    return { article, score: matches ? score : 0, excerpt: `${start ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}` };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);
}
