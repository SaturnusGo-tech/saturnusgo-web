import { docArticles as englishArticles, docGroups as englishGroups } from "../../core-tms/documentation/content/catalog";
import { docArticles as russianArticles, docGroups as russianGroups } from "../../core-tms/documentation/content-ru/catalog";
import { isProductDocsPreviewImage } from "../../core-tms/documentation/content/product-docs/guide-captures";
import type { DocSection } from "../../core-tms/documentation/model/article";
import type { PublicDocBlock, PublicDocCatalog, PublicDocLocale, PublicDocSection } from "./model";

// This server-side projection is the only bridge to the in-app guide. New articles
// are private by default. Production walkthroughs stay in the workspace guide.
const publicArticleIds = new Set([
  "introduction", "quick-start", "workspace", "navigation", "settings", "portfolios", "dashboard",
  "create-test-case", "edit-test-case", "archive-test-case", "custom-fields", "custom-field-values",
  "colored-marker", "case-comments", "shared-steps", "organize-cases", "import-export", "test-suites",
  "create-run", "execute-run", "retest", "create-defect", "link-defect", "notifications",
  "telegram-notifications", "browser-notifications", "integration-overview", "codex-web-qa",
  "codex-prompts", "codex-prompts-repository", "codex-prompts-runs", "codex-prompts-web-qa",
  "codex-prompts-defects", "codex-prompts-reporting", "codex-prompts-configuration",
  "product-docs-authoring", "codex-prompts-product-docs",
  "youtrack", "jira", "linear", "trello", "github", "slack", "confluence", "swagger",
  "integration-troubleshooting", "api-testing", "permissions", "glossary", "contact-support",
]);

function publicSection(section: DocSection, articleId: string, locale: PublicDocLocale): PublicDocSection | null {
  if (articleId === "codex-web-qa" && section.id === "purpose") return {
    id: "purpose", title: locale === "ru" ? "Подключённый QA в Codex" : "Connected QA in Codex",
    blocks: [{ kind: "paragraph", text: locale === "ru"
      ? "Подключённый плагин Falcon в Codex помогает находить и поддерживать тест-кейсы, готовить прогоны и сохранять результаты разрешённых QA-действий. Доступ определяется вашей ролью и разрешениями подключения."
      : "The connected Falcon plugin in Codex helps you find and maintain test cases, prepare runs, and save results from authorized QA actions. Your role and connection permissions determine the available actions." }],
  };
  const blocks: PublicDocBlock[] = section.blocks.flatMap((block): PublicDocBlock[] => {
    if (block.kind === "walkthrough") {
      if (articleId !== "product-docs-authoring") return [];
      const steps = block.steps.filter(step => isProductDocsPreviewImage(step.image.src, locale));
      return steps.length ? [{ ...block, steps }] : [];
    }
    if (block.kind === "articles") {
      const ids = block.ids.filter(id => publicArticleIds.has(id));
      return ids.length ? [{ kind: "articles", ids }] : [];
    }
    if (articleId === "navigation" && section.id === "utilities" && block.kind === "table") return [{
      ...block, rows: block.rows.map(row => /Avatar → Help|Аватар → Помощь/.test(row[0])
        ? [row[0], locale === "ru" ? "Открывает руководство Falcon." : "Opens the Falcon guide."] : row),
    }];
    return [block];
  });
  return blocks.length ? { id: section.id, title: section.title, blocks } : null;
}

export function publicDocumentationCatalog(locale: PublicDocLocale): PublicDocCatalog {
  const source = locale === "ru" ? russianArticles : englishArticles;
  const articles = source.filter(article => publicArticleIds.has(article.id) && !article.adminOnly).map(article => ({
    id: article.id, title: article.title, description: article.description, group: article.group,
    keywords: article.keywords, related: article.related.filter(id => publicArticleIds.has(id)),
    sections: article.sections
      .filter(section => article.id !== "introduction" || !["reading", "guide-chat"].includes(section.id))
      .map(section => publicSection(section, article.id, locale)).filter((section): section is PublicDocSection => section !== null),
    ...(article.status ? { status: article.status } : {}),
  }));
  const groups = (locale === "ru" ? russianGroups : englishGroups).filter(group => articles.some(article => article.group === group.id));
  return { articles, groups };
}
