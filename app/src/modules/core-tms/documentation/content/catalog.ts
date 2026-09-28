import { navigationArticle } from "./navigation/sidebar";
import { settingsArticle } from "./navigation/settings";
import { customFieldsArticle } from "./custom-fields/overview";
import { customFieldValuesArticle } from "./custom-fields/values";
import { coloredMarkerArticle } from "./writing/marker";
import { writingAssistantArticle } from "./writing/assistant";
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
  { id: "start", title: "Getting started" },
  { id: "cases", title: "Test repository" },
  { id: "runs", title: "Runs and results" },
  { id: "defects", title: "Working with defects" },
  { id: "notifications", title: "Notifications" },
  { id: "integrations", title: "Integrations" },
  { id: "reference", title: "Reference" },
] as const;
export const docArticles: readonly DocArticle[] = [
  supportArticle,
  ...gettingStarted, navigationArticle, settingsArticle, ...companyAccessArticles, portfoliosArticle, dashboardArticle, ...caseAuthoring, customFieldsArticle, customFieldValuesArticle, writingAssistantArticle, coloredMarkerArticle, caseCommentsArticle, ...caseOrganization,
  suitesArticle, ...executionArticles, ...defectArticles, notificationsArticle, ...notificationChannelArticles, integrationOverview,
  boardAndYouTrack[1], ...trackerArticles, boardAndYouTrack[0], githubArticle,
  ...communicationArticles, swaggerArticle, ...plannedIntegrations, troubleshootingArticle, toolsArticle, ...referenceArticles,
];
export const articleById = new Map(docArticles.map((article) => [article.id, article]));
