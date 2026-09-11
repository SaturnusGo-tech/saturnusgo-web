import { supportArticle } from "./support/contact";
import { companyAccessArticles } from "./access/company-access";
import { swaggerArticle } from "./integrations/swagger/swagger";
import { portfoliosArticle } from "./organization/portfolios";
import { gettingStarted } from "./start/getting-started";
import { dashboardArticle } from "./start/dashboard";
import { caseAuthoring } from "./cases/authoring";
import { caseCommentsArticle } from "./cases/discussion/comments";
import { caseOrganization } from "./cases/organization";
import { executionArticles } from "./runs/execution";
import { suitesArticle } from "./runs/suites";
import { defectArticles } from "./defects/defects";
import { integrationOverview } from "./integrations/overview/overview";
import { trackerArticles } from "./integrations/trackers";
import { boardAndYouTrack } from "./integrations/trello-youtrack";
import { githubArticle } from "./integrations/delivery/github";
import { communicationArticles } from "./integrations/delivery/communication";
import { plannedIntegrations } from "./integrations/operations/planned";
import { troubleshootingArticle } from "./integrations/operations/troubleshooting";
import { referenceArticles } from "./reference/reference";
import { toolsArticle } from "./reference/tools";
import { notificationsArticle } from "./notifications/overview";
import { notificationChannelArticles } from "./notifications/channels";
import type { DocArticle } from "../model/article";

export const docGroups = [
  { id: "start", title: "Начало работы" },
  { id: "cases", title: "Тестовая база" },
  { id: "runs", title: "Прогоны и результаты" },
  { id: "defects", title: "Работа с дефектами" },
  { id: "notifications", title: "Уведомления" },
  { id: "integrations", title: "Интеграции" },
  { id: "reference", title: "Справочник" },
] as const;
export const docArticles: readonly DocArticle[] = [
  supportArticle,
  ...gettingStarted, ...companyAccessArticles, portfoliosArticle, dashboardArticle, ...caseAuthoring, caseCommentsArticle, ...caseOrganization,
  suitesArticle, ...executionArticles, ...defectArticles, notificationsArticle, ...notificationChannelArticles, integrationOverview,
  boardAndYouTrack[1], ...trackerArticles, boardAndYouTrack[0], githubArticle,
  ...communicationArticles, swaggerArticle, ...plannedIntegrations, troubleshootingArticle, toolsArticle, ...referenceArticles,
];
export const articleById = new Map(docArticles.map((article) => [article.id, article]));
