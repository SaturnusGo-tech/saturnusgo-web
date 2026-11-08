import { falconProductImage } from '../../../../core-falcon-public/shared/product-images';

export type DocumentationFolder = {
  id: string;
  title: string;
  articleIds: string[];
  children: DocumentationFolder[];
};

type FolderDefinition = {
  id: string;
  title: { en: string; ru: string };
  articleIds: readonly string[];
};

// Presentation metadata only. The caller supplies the authorized catalog; this
// module never loads article content or expands the caller's article allowlist.
const subfolders: Readonly<Record<string, readonly FolderDefinition[]>> = {
  start: [
    { id: "workspace", title: { en: "Your workspace", ru: "Рабочее пространство" }, articleIds: ["workspace", "portfolios", "dashboard"] },
  ],
  cases: [
    { id: "fields", title: { en: "Fields and values", ru: "Поля и значения" }, articleIds: ["custom-fields", "custom-field-values"] },
    { id: "writing", title: { en: "Writing and collaboration", ru: "Текст и обсуждения" }, articleIds: ["falcon-ai-writing", "colored-marker", "case-comments"] },
    { id: "organization", title: { en: "Repository organization", ru: "Организация репозитория" }, articleIds: ["shared-steps", "organize-cases", "import-export"] },
  ],
  runs: [
    { id: "execution", title: { en: "Test execution", ru: "Выполнение тестов" }, articleIds: ["execute-run", "retest"] },
  ],
  notifications: [
    { id: "channels", title: { en: "Delivery channels", ru: "Каналы уведомлений" }, articleIds: ["telegram-notifications", "browser-notifications"] },
  ],
  integrations: [
    { id: "issue-trackers", title: { en: "Issue trackers", ru: "Трекеры задач" }, articleIds: ["youtrack", "jira", "linear", "trello"] },
    { id: "development", title: { en: "Development and CI", ru: "Разработка и CI" }, articleIds: ["github", "gitlab", "teamcity", "jenkins"] },
    { id: "communication", title: { en: "Team communication", ru: "Командная работа" }, articleIds: ["slack", "confluence"] },
    { id: "apis", title: { en: "Connected APIs", ru: "Подключённые API" }, articleIds: ["swagger"] },
  ],
  "codex-prompts": [
    { id: "coverage", title: { en: "Coverage and setup", ru: "Покрытие и настройки" }, articleIds: ["codex-prompts-repository", "codex-prompts-configuration"] },
    { id: "product-docs", title: { en: "Product documentation", ru: "Документация продукта" }, articleIds: ["codex-prompts-product-docs"] },
    { id: "execution", title: { en: "Execution and follow-up", ru: "Проверки и дефекты" }, articleIds: ["codex-prompts-runs", "codex-prompts-web-qa", "codex-prompts-defects"] },
    { id: "reporting", title: { en: "Reports and monitoring", ru: "Отчёты и мониторинг" }, articleIds: ["codex-prompts-reporting"] },
  ],
  reference: [
    { id: "access", title: { en: "Settings and access", ru: "Настройки и доступ" }, articleIds: ["settings", "company-administration", "permissions"] },
  ],
};

export function buildDocumentationFolders(
  articles: readonly { id: string; group: string }[],
  groups: readonly { id: string; title: string }[],
  locale: "en" | "ru",
): DocumentationFolder[] {
  const seenArticles = new Set<string>();
  const byGroup = new Map<string, string[]>();
  for (const article of articles) {
    if (seenArticles.has(article.id)) continue;
    seenArticles.add(article.id);
    const ids = byGroup.get(article.group) ?? [];
    ids.push(article.id);
    byGroup.set(article.group, ids);
  }

  const seenGroups = new Set<string>();
  return groups.flatMap(group => {
    if (seenGroups.has(group.id)) return [];
    seenGroups.add(group.id);
    const articleIds = byGroup.get(group.id);
    if (!articleIds?.length) return [];

    const nestedIds = new Set<string>();
    const definitions = Object.prototype.hasOwnProperty.call(subfolders, group.id) ? subfolders[group.id] : [];
    const children = definitions.flatMap(definition => {
      const members = new Set(definition.articleIds);
      const ids = articleIds.filter(id => members.has(id) && !nestedIds.has(id));
      if (!ids.length) return [];
      ids.forEach(id => nestedIds.add(id));
      return [{ id: `${group.id}:${definition.id}`, title: definition.title[locale], articleIds: ids, children: [] }];
    });
    return [{ id: group.id, title: group.title, articleIds: articleIds.filter(id => !nestedIds.has(id)), children }];
  });
}

export type DocumentationArticleImage = { src: string; alt: string; width: number; height: number };

// Reviewed product captures, also used on the public product page. Keep private
// guide screenshots and their company-specific captions out of here.
const illustrations = {
  repository: { alt: {
    en: "Falcon test repository with folders, a test case scenario, and case properties.",
    ru: "Репозиторий Falcon: папки, сценарий тест-кейса и его свойства.",
  } },
  run: { alt: {
    en: "A Falcon test run with its case list, scenario steps, and execution results.",
    ru: "Тестовый прогон Falcon: список кейсов, шаги сценария и результаты выполнения.",
  } },
  suites: { alt: {
    en: "Falcon test suites with manual and automatic case selections.",
    ru: "Тестовые наборы Falcon с ручным и автоматическим подбором кейсов.",
  } },
  dashboard: { alt: {
    en: "Falcon Guide Release quality dashboard, Defects section: status breakdown, two total defects and linked-defect metrics.",
    ru: "Дашборд качества релиза Falcon, раздел Дефекты: статусы, общее число, связи с трекерами и метрики текущих дефектов.",
  } },
  integrations: { alt: {
    en: "The Falcon integrations catalog with issue trackers, development tools, and connected services.",
    ru: "Каталог интеграций Falcon: трекеры задач, инструменты разработки и подключённые сервисы.",
  } },
  codex: { alt: {
    en: "The Falcon Codex integration with examples for preparing test cases and test runs.",
    ru: "Интеграция Falcon с Codex: примеры подготовки тест-кейсов и прогонов.",
  } },
} as const;

const articleIllustrations = new Map<string, keyof typeof illustrations>([
  ["quick-start", "repository"], ["create-test-case", "repository"], ["edit-test-case", "repository"],
  ["organize-cases", "repository"], ["import-export", "repository"],
  ["create-run", "run"], ["execute-run", "run"], ["retest", "run"],
  ["test-suites", "suites"], ["dashboard", "dashboard"],
  ["integration-overview", "integrations"], ["codex-web-qa", "codex"],
]);

export function documentationArticleImage(articleId: string, locale: "en" | "ru" = "en"): DocumentationArticleImage | undefined {
  const name = articleIllustrations.get(articleId);
  if (!name) return undefined;
  const image = illustrations[name];
  return { ...falconProductImage(name, locale), alt: image.alt[locale] };
}
