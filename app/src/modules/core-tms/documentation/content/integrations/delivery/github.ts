import { githubWalkthrough } from "../../walkthroughs/integrations/delivery";
import { code, note, paragraph, section, steps, table, warning, type DocArticle } from "../../../model/article";
export const githubArticle: DocArticle = {
  id: "github", title: "GitHub и GitHub Actions", group: "integrations", description: "Свяжите изменения кода с нужными тестами: автоматические раны, точная сборка и результат QA в статусе коммита.",
  keywords: ["GitHub", "Actions", "CI", "PR", "pull request", "push", "релиз", "билд упал", "workflow"], related: ["test-suites", "slack", "integration-troubleshooting"],
  sources: [{ title: "GitHub: создание webhook", url: "https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks" },
    { title: "GitHub: токены доступа", url: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens" }],
  sections: [
      section("walkthrough", "Где настраивать в Falcon", githubWalkthrough),
    section("flow", "Что происходит автоматически", table(["Событие", "Когда Falcon создаёт прогон"],
      ["Pull request", "Открытие, повторное открытие, новый commit или готовность к review. PR должен быть открытым и не draft."],
      ["Push", "Изменение ветки; удаление ветки и push тега не используются как запуск."],
      ["Release", "Публикация релиза."],
      ["GitHub Actions", "Завершение workflow_run с failure, timed_out, action_required или startup_failure."]),
      paragraph("Событие должно быть включено в подключении и совпасть с правилом тестирования. Каждое совпавшее правило создаёт прогон выбранного набора с окружением, сборкой и ссылкой на источник.")),
    section("access", "Подготовьте репозиторий и токен", paragraph("Используйте токен с доступом только к нужному репозиторию. Текущему коннектору нужны **Contents: read**, **Pull requests: read** и **Commit statuses: write**. Отдельно нужны права администратора репозитория для настройки webhook.")),
    section("connect", "Настройте подключение", steps(
      ["Заполните «Хуки → GitHub»", "Введите API token и репозиторий в формате owner/name. Нажмите «Проверить доступ» и сверьте репозиторий."],
      ["Сохраните выключенным", "Получите Webhook URL. Подготовьте отдельный случайный секрет не менее 32 символов."],
      ["Добавьте webhook GitHub", "В репозитории откройте Settings → Webhooks → Add webhook. Укажите Payload URL из Falcon, Content type application/json и тот же Secret."],
      ["Выберите события", "Выберите Pull requests, Pushes, Releases и Workflow runs для нужных сценариев. Оставьте проверку TLS включённой. Сохраните секрет в Falcon."])),
    section("rules", "Выберите, какие тесты запускать", steps(
      ["Подготовьте сьют и окружение", "Они должны существовать в текущем проекте Falcon. Проверьте, что набор не пустой."],
      ["Добавьте правило", "В «Автоматизации» отметьте событие и нажмите «Добавить правило». Задайте короткое уникальное имя, событие, набор тестов и окружение."],
      ["Уточните фильтры", "Ветки задаются через запятую. Для PR это целевая ветка; для push — изменённая. Префиксы путей применяются к PR и push; для релизов и Actions оставьте их пустыми."],
      ["Включите и сохраните", "Проверьте все правила. Одно событие может совпасть с несколькими правилами и создать несколько целевых прогонов."])),
    section("example", "Пример правила", code("text", "Проверка оплаты перед merge", "Название правила: checkout-pr\nСобытие: Pull request готов к проверке\nНабор тестов: Checkout smoke\nОкружение: Staging\nВетки: main\nПрефиксы изменённых путей: src/payments/, app/checkout/"),
      note("Это префиксы, не glob-шаблоны", "Задавайте начало пути из репозитория. Не подставляйте **/*.test.ts вместо префикса каталога.")),
    section("result", "Верните результат в GitHub", paragraph("Выполните созданный ран в Falcon. При включённых событиях завершения и остановки коннектор публикует итог в статус коммита. Проверяйте статус именно того SHA, для которого создан запуск."),
      warning("Falcon не настраивает защиту ветки", "Если QA должен блокировать merge, администратор GitHub отдельно настраивает обязательный status check в правилах репозитория. Ручной результат Falcon не перезапускает упавший workflow Actions.")),
    section("verify", "Проверка подключения", paragraph("Откройте согласованный контрольный PR, совпадающий с правилом. Проверьте webhook delivery в GitHub, журнал Falcon и состав созданного рана. Затем выполните его и сверьте статус коммита. Для сообщений о релизах и падениях настройте Slack отдельно.")),
  ],
};
