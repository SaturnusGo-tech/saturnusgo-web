import type { Provider, Settings } from "../model/connector-types";
const names: Record<Provider, string> = { swagger: "Swagger", jira: "Jira", trello: "Trello", linear: "Linear", github: "GitHub", slack: "Slack", confluence: "Confluence" };
const copy: Record<Provider, { heading: [string, string]; purpose: [string, string]; remote: [string, string];
  destination: [string, string]; hint: [string, string]; docs: string }> = {
  swagger: { heading: ["API вашего проекта", "Your project’s API"],
    purpose: ["Подключите спецификацию OpenAPI. Команда сможет изучать операции и проверять запросы прямо в Falcon.", "Connect an OpenAPI specification so your team can explore operations and test requests in Falcon."],
    remote: ["Спецификация", "Specification"], destination: ["API Testing", "API Testing"],
    hint: ["JSON или YAML по HTTPS. Доступ к спецификации настраивается отдельно от авторизации запросов к API.", "JSON or YAML over HTTPS. Specification access is separate from API request authorization."],
    docs: "https://swagger.io/docs/specification/" },
  jira: { heading: ["Качество в вашем проекте", "Quality in your project"],
    purpose: ["Дефекты становятся задачами Jira. Готовое исправление возвращается в Falcon для повторной проверки.", "Defects become Jira issues. Ready fixes return to Falcon for retesting."],
    remote: ["Ключ проекта Jira", "Jira project key"], destination: ["Тип задачи", "Issue type"],
    hint: ["API token и почта Atlassian. Нужны права чтения проекта, создания, изменения и переходов задач.", "Use an Atlassian API token and email with project read, issue create, edit and transition permissions."],
    docs: "https://developer.atlassian.com/cloud/jira/platform/webhooks/" },
  trello: { heading: ["От дефекта до готовой карточки", "From defect to finished card"],
    purpose: ["Карточки с шагами воспроизведения, движением по спискам и обратной связью с тестированием.", "Cards carry reproduction steps, move through lists and keep testing in sync."],
    remote: ["ID доски Trello", "Trello board ID"], destination: ["Список новых дефектов", "New defect list"],
    hint: ["API key Power-Up, пользовательский token с read/write и секрет приложения для проверки вебхуков.", "Use a Power-Up API key, a user token with read/write and the application secret to verify webhooks."],
    docs: "https://developer.atlassian.com/cloud/trello/guides/rest-api/webhooks/" },
  linear: { heading: ["Замкните цикл обратной связи", "Close the feedback loop"],
    purpose: ["Задачи для инженерной команды с контекстом дефекта и возвратом исправлений на ретест.", "Engineering issues with defect context and a clear path back to retesting."],
    remote: ["ID команды Linear", "Linear team ID"], destination: ["Назначение", "Destination"],
    hint: ["API key с доступом к выбранной команде и управлением задачами. Секрет подписи берётся из настроек вебхука.", "Use an API key with access to the selected team and issue management. Copy the signing secret from webhook settings."],
    docs: "https://linear.app/developers/webhooks" },
  github: { heading: ["Каждому изменению — свои тесты", "The right tests for every change"],
    purpose: ["PR, коммиты, релизы и падения Actions создают прогоны. Итог ручной проверки возвращается в статус коммита.", "PRs, commits, releases and failed Actions create test runs. QA results return as commit statuses."],
    remote: ["Репозиторий owner/name", "Repository owner/name"], destination: ["Назначение", "Destination"],
    hint: ["Токен репозитория: Contents read, Pull requests read, Commit statuses write. Подпишите вебхук отдельным секретом.", "Repository token: Contents read, Pull requests read, Commit statuses write. Sign the webhook with a separate secret."],
    docs: "https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks" },
  slack: { heading: ["Команда знает, что происходит", "Keep the team in the loop"],
    purpose: ["Бот сообщает о прогонах, релизах, падениях сборки и дефектах в выбранном канале.", "A bot posts run, release, build failure and defect updates to your chosen channel."],
    remote: ["ID канала Slack", "Slack channel ID"], destination: ["Назначение", "Destination"],
    hint: ["Bot token: chat:write, channels:read, groups:read для приватного канала. Добавьте бота в канал.", "Bot token: chat:write, channels:read, and groups:read for a private channel. Add the bot to the channel."],
    docs: "https://docs.slack.dev/reference/methods/chat.postMessage/" },
  confluence: { heading: ["Результаты, к которым возвращаются", "Results worth returning to"],
    purpose: ["Завершённый прогон становится страницей отчёта: результаты, сборка, окружение и ссылка на доказательства в Falcon.", "A completed run becomes a report page with results, build, environment and evidence links in Falcon."],
    remote: ["ID пространства Confluence", "Confluence space ID"], destination: ["ID родительской страницы", "Parent page ID"],
    hint: ["API token и почта Atlassian с правами просмотра пространства и создания/изменения страниц.", "Use an Atlassian API token and email with space read and page create/edit permissions."],
    docs: "https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/" },
};
export const providerCopy = (provider: Provider, ru: boolean) => {
  const c = copy[provider]; const i = ru ? 0 : 1;
  return { name: names[provider], heading: c.heading[i], purpose: c.purpose[i], remote: c.remote[i],
    destination: c.destination[i], hint: c.hint[i], docs: c.docs };
};
const events: Record<Settings["events"][number], [string, string]> = {
  "defect.created": ["Новый дефект", "Defect created"], "defect.updated": ["Изменение дефекта", "Defect updated"],
  "defect.status_changed": ["Статус дефекта", "Defect status changed"], "defect.fix_confirmed": ["Исправление подтверждено", "Fix confirmed"],
  "run.created": ["Прогон создан", "Run created"], "run.start": ["Прогон начат", "Run started"],
  "run.complete": ["Прогон завершён", "Run completed"], "run.abort": ["Прогон остановлен", "Run aborted"],
  pull_request: ["Pull request готов к проверке", "Pull request ready for QA"], push: ["Новый коммит", "New commit"],
  release: ["Релиз опубликован", "Release published"], workflow_failed: ["Сборка Actions упала", "Actions build failed"],
  "github.release": ["Релиз GitHub", "GitHub release"], "github.workflow_failed": ["Сбой GitHub Actions", "GitHub Actions failure"],
};
export const eventLabel = (event: string, ru: boolean) => events[event as keyof typeof events]?.[ru ? 0 : 1] ?? event;
export const statusLabel = (status: string, ru: boolean) => ({
  open: ["Открыт", "Open"], triaged: ["Разобран", "Triaged"], in_progress: ["В работе", "In progress"],
  ready_for_retest: ["На проверку", "Ready for QA"], verified: ["Проверен", "Verified"],
  closed: ["Закрыт", "Closed"], reopened: ["Переоткрыт", "Reopened"],
  pending: ["В очереди", "Queued"], processing: ["В обработке", "Processing"], delivered: ["Доставлено", "Delivered"],
  failed: ["Ошибка", "Failed"], uncertain: ["Нужно сверить", "Reconciliation needed"], cancelled: ["Отменено", "Cancelled"],
  ignored: ["Пропущено по правилу", "Ignored by rule"],
} as Record<string, string[]>)[status]?.[ru ? 0 : 1] ?? status;
