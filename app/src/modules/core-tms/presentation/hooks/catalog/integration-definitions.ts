import type { IconType } from "react-icons";
import {
  FaConfluence,
  FaGithub,
  FaGitlab,
  FaJenkins,
  FaJira,
  FaSlack,
  FaTrello,
} from "react-icons/fa6";
import { SiLinear, SiTeamcity, SiSwagger } from "react-icons/si";

export type IntegrationId =
  | "codex" | "youtrack" | "jira" | "linear" | "trello" | "github"
  | "gitlab" | "jenkins" | "teamcity" | "slack" | "confluence" | "swagger";

export type IntegrationGroup = "tracker" | "delivery" | "communication" | "api" | "ai";

export type IntegrationDefinition = Readonly<{
  id: IntegrationId;
  name: string;
  description: { ru: string; en: string };
  group: IntegrationGroup;
  icon?: IconType;
}>;

export const INTEGRATION_GROUPS = ["ai", "tracker", "delivery", "communication", "api"] as const;

export const INTEGRATIONS: readonly IntegrationDefinition[] = [
  item("codex", "Codex", "ai", "QA-задачи с AI в Falcon", "AI testing workflows in Falcon"),
  item("swagger", "Swagger", "api", "Спецификации OpenAPI и проверки API",
    "OpenAPI specifications and API checks", SiSwagger),
  item("youtrack", "YouTrack", "tracker",
    "Дефекты и синхронизация статусов",
    "Create defects and sync statuses"),
  item("jira", "Jira", "tracker",
    "Задачи и релизы команды",
    "Connect issues and releases", FaJira),
  item("linear", "Linear", "tracker",
    "Дефекты и контекст для разработки",
    "Share defects with engineering", SiLinear),
  item("trello", "Trello", "tracker",
    "Карточки по результатам тестирования",
    "Create cards from test results", FaTrello),
  item("github", "GitHub", "delivery",
    "Тесты и изменения в репозитории",
    "Link tests to repository changes", FaGithub),
  item("gitlab", "GitLab", "delivery",
    "Задачи, merge requests и pipelines",
    "Issues, merge requests and pipelines", FaGitlab),
  item("jenkins", "Jenkins", "delivery",
    "Автотесты и результаты сборок",
    "Automated tests and build results", FaJenkins),
  item("teamcity", "TeamCity", "delivery",
    "Прогоны и конфигурации сборок",
    "Test runs and build configurations", SiTeamcity),
  item("slack", "Slack", "communication",
    "Уведомления о прогонах и дефектах",
    "Run and defect notifications", FaSlack),
  item("confluence", "Confluence", "communication",
    "Отчёты и тестовая документация",
    "Publish reports and test docs", FaConfluence),
];

function item(
  id: IntegrationId,
  name: string,
  group: IntegrationGroup,
  ru: string,
  en: string,
  icon?: IconType,
): IntegrationDefinition {
  return { id, name, group, description: { ru, en }, ...(icon ? { icon } : {}) };
}
