import { INTEGRATIONS, type IntegrationId } from "../../catalog/integration-definitions";
import { isProvider } from "../../../../connectors/model/connector-types";
import { providerCopy } from "../../../../connectors/localization/connector-copy";
const workflows: Partial<Record<IntegrationId, readonly [string, string][]>> = {
  youtrack: [["Передайте дефект с шагами и результатами", "Send a defect with steps and results"], ["Сопоставьте статусы команды с Falcon", "Map team statuses to Falcon"], ["Верните готовое исправление на проверку", "Bring a ready fix back to QA"]],
  jira: [["Создайте задачу из баг-репорта", "Create an issue from a bug report"], ["Выберите проект и тип задачи", "Choose a project and issue type"], ["Получайте исправления на повторную проверку", "Bring fixes back for retesting"]],
  linear: [["Передайте дефект инженерной команде", "Send a defect to engineering"], ["Сохраните контекст воспроизведения", "Keep reproduction context attached"], ["Синхронизируйте статусы исправления", "Sync the fix status with QA"]],
  trello: [["Создайте карточку по результатам теста", "Create a card from test results"], ["Направляйте дефекты в нужный список", "Route defects to the right list"], ["Следите за движением исправления", "Follow the fix through your board"]],
  github: [["Свяжите изменения с тестированием", "Connect repository changes to testing"], ["Проверьте состав проверки перед запуском", "Review test scope before starting a run"], ["Верните результаты в статус коммита", "Return QA results to the commit status"]],
  slack: [["Сообщайте команде о начале прогона", "Let the team know a run has started"], ["Отправляйте обновления по дефектам", "Share defect updates in your channel"], ["Держите результаты релиза под рукой", "Keep release results within reach"]],
  confluence: [["Публикуйте результаты завершённого прогона", "Publish completed run results"], ["Сохраняйте сборку и окружение в отчёте", "Include the build and environment"], ["Возвращайтесь к доказательствам в Falcon", "Link back to evidence in Falcon"]],
  swagger: [["Подключите спецификацию OpenAPI", "Connect an OpenAPI specification"], ["Изучайте операции вашего API", "Explore your API operations"], ["Проверяйте запросы прямо в Falcon", "Test requests directly in Falcon"]],
};
export function pluginContent(id: IntegrationId, ru: boolean) {
  const item = INTEGRATIONS.find(entry => entry.id === id)!;
  const category = { ai: ["AI и автоматизация", "AI and automation"], tracker: ["Задачи и планирование", "Tasks and planning"], delivery: ["Код и сборки", "Code and builds"], communication: ["Коммуникация и знания", "Communication and knowledge"], api: ["API и контракты", "API and contracts"] }[item.group][ru ? 0 : 1];
  return { ...item, category, description: item.description[ru ? "ru" : "en"],
    purpose: isProvider(id) ? providerCopy(id, ru).purpose : ru ? "Связывайте дефекты Falcon с YouTrack и возвращайте готовые исправления на повторную проверку. Настройте проекты, маршруты и статусы команды." : "Connect Falcon defects to YouTrack and return ready fixes for retesting. Configure projects, routes and team statuses.",
    workflows: (workflows[id] ?? []).map(pair => pair[ru ? 0 : 1]) };
}
