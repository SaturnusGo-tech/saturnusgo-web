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
import { SiLinear, SiTeamcity } from "react-icons/si";

export type IntegrationId =
  | "youtrack" | "jira" | "linear" | "trello" | "github"
  | "gitlab" | "jenkins" | "teamcity" | "slack" | "confluence";

export type IntegrationGroup = "tracker" | "delivery" | "communication";

export type IntegrationDefinition = Readonly<{
  id: IntegrationId;
  name: string;
  description: { ru: string; en: string };
  group: IntegrationGroup;
  icon?: IconType;
}>;

export const INTEGRATION_GROUPS = ["tracker", "delivery", "communication"] as const;

export const INTEGRATIONS: readonly IntegrationDefinition[] = [
  item("youtrack", "YouTrack", "tracker",
    "Создание задач по дефектам и синхронизация статусов.",
    "Create defect issues and keep their statuses in sync."),
  item("jira", "Jira", "tracker",
    "Связь тестирования с задачами и релизами Jira.",
    "Connect testing with Jira issues and releases.", FaJira),
  item("linear", "Linear", "tracker",
    "Передача дефектов и контекста команде разработки.",
    "Send defects and test context to engineering.", SiLinear),
  item("trello", "Trello", "tracker",
    "Создание карточек по результатам тестирования.",
    "Create cards from test results.", FaTrello),
  item("github", "GitHub", "delivery",
    "Связь кейсов, дефектов и изменений в репозитории.",
    "Link cases and defects with repository changes.", FaGithub),
  item("gitlab", "GitLab", "delivery",
    "Интеграция с issues, merge requests и pipelines.",
    "Connect issues, merge requests, and pipelines.", FaGitlab),
  item("jenkins", "Jenkins", "delivery",
    "Запуск автотестов и получение результатов сборок.",
    "Run automated tests and receive build results.", FaJenkins),
  item("teamcity", "TeamCity", "delivery",
    "Синхронизация прогонов с конфигурациями сборок.",
    "Sync test runs with build configurations.", SiTeamcity),
  item("slack", "Slack", "communication",
    "Уведомления о прогонах, дефектах и блокировках.",
    "Notify teams about runs, defects, and blockers.", FaSlack),
  item("confluence", "Confluence", "communication",
    "Публикация отчетов и тестовой документации.",
    "Publish reports and test documentation.", FaConfluence),
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
