import { createHash } from "node:crypto";
import type { DocArticle, DocBlock } from "../../app/src/modules/core-tms/documentation/model/article";

type Locale = "en" | "ru";
type CorpusArticle = {
  id: string;
  locale: Locale;
  title: string;
  description: string;
  keywords: string[];
  adminOnly: boolean;
  status: "available" | "planned";
  sections: { id: string; title: string; text: string }[];
};

function blockText(block: DocBlock, articles: ReadonlyMap<string, DocArticle>): string {
  switch (block.kind) {
    case "paragraph": return block.text;
    case "list": return block.items.map((item, index) => `${block.ordered ? `${index + 1}.` : "-"} ${item}`).join("\n");
    case "steps": return block.items.map((item, index) => `${index + 1}. ${item.title}\n${item.text}`).join("\n\n");
    case "callout": return `${block.title}\n${block.text}`;
    case "table": return [block.columns, ...block.rows].map(row => row.join(" | ")).join("\n");
    case "code": return `${block.caption}\n\`\`\`${block.language}\n${block.text}\n\`\`\``;
    case "articles": return block.ids.map(id => {
      const article = articles.get(id);
      if (!article) throw new Error(`Unresolved article reference: ${id}`);
      return `${article.title} (article: ${id})`;
    }).join("\n");
    case "walkthrough": return [block.title, ...block.steps.map((step, index) =>
      `${index + 1}. ${step.title}\n${step.instruction}\n${step.result}\n${step.image.alt}`,
    )].join("\n\n");
    default: {
      const unsupported: never = block;
      throw new Error(`Unsupported documentation block: ${JSON.stringify(unsupported)}`);
    }
  }
}

export function buildGuideCorpus(catalogs: Record<Locale, readonly DocArticle[]>) {
  const articles: CorpusArticle[] = [];
  for (const locale of ["en", "ru"] as const) {
    const catalog = catalogs[locale];
    const byId = new Map(catalog.map(article => [article.id, article]));
    if (byId.size !== catalog.length) throw new Error(`Duplicate ${locale} article identity`);
    for (const article of [...catalog].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
      const sectionIds = new Set(article.sections.map(section => section.id));
      if (sectionIds.size !== article.sections.length) throw new Error(`Duplicate section in ${locale}:${article.id}`);
      articles.push({
        id: article.id, locale, title: article.title, description: article.description,
        keywords: [...article.keywords], adminOnly: article.adminOnly === true, status: article.status ?? "available",
        sections: article.sections.map(section => ({
          id: section.id, title: section.title,
          text: section.blocks.map(block => blockText(block, byId)).join("\n\n"),
        })),
      });
    }
  }
  const identities = (locale: Locale) => articles.filter(article => article.locale === locale).map(article => article.id);
  if (JSON.stringify(identities("en")) !== JSON.stringify(identities("ru"))) throw new Error("Guide locale article identities differ");
  const version = createHash("sha256").update(JSON.stringify(articles)).digest("hex");
  return { version, articles };
}
