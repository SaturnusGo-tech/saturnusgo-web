import { articles, note, paragraph, section, steps, type DocArticle } from "../../../model/article";

export const plannedIntegrations: DocArticle[] = [
  { id: "gitlab", title: "GitLab", group: "integrations", status: "planned",
    description: "Текущий статус интеграции GitLab и способ сохранить контекст merge request или pipeline в проверке.",
    keywords: ["GitLab", "гитлаб", "merge request", "pipeline", "CI"], related: ["github", "create-run"],
    sections: [
      section("status", "Статус: скоро", note("Подключение пока недоступно", "В каталоге Falcon карточка GitLab помечена «Скоро». Формы подключения, обработчика webhook GitLab и автоматического создания ранов по merge request или pipeline сейчас нет.")),
      section("today", "Как работать сейчас", steps(
        ["Создайте ран вручную", "Подберите кейсы или сьют в Falcon, укажите целевое окружение."],
        ["Зафиксируйте сборку", "Используйте точный commit SHA или идентификатор pipeline, который вы проверяете."],
        ["Сохраните контекст", "Добавьте ссылку на merge request или pipeline в описание связанного дефекта или материалы проверки, когда это нужно для воспроизведения."],
        ["Передайте итог команде", "После выполнения используйте ссылку на прогон. Обратный статус в GitLab автоматически не публикуется."])),
      section("next", "Готовая автоматизация", paragraph("Для репозиториев GitHub уже доступна настройка прогонов по изменениям кода и падениям Actions. Это отдельный коннектор: webhook GitLab нельзя направлять на его endpoint."), articles("github", "test-suites")),
    ] },
  { id: "teamcity", title: "TeamCity", group: "integrations", status: "planned",
    description: "Что доступно для проверок сборок TeamCity до появления встроенного коннектора.",
    keywords: ["TeamCity", "тимсити", "build configuration", "CI", "сборки"], related: ["create-run", "slack"],
    sections: [
      section("status", "Статус: скоро", note("Автоматический обмен не подключён", "Карточка TeamCity есть в каталоге Falcon со статусом «Скоро». Сейчас нельзя настроить автоматический запуск Falcon по build configuration, импорт результатов или обратную публикацию в TeamCity через эту карточку.")),
      section("today", "Проверить сборку вручную", steps(
        ["Выберите проверяемую сборку", "В TeamCity зафиксируйте build number и revision, а также целевой стенд."],
        ["Запустите нужный набор в Falcon", "Укажите ту же сборку и окружение. Состав запуска выберите по области изменений."],
        ["Оформите результат", "Запишите фактическое поведение и ссылки на логи в материалах дефекта. Не объявляйте падение CI успешным на основании одного статуса Falcon."])),
      section("notifications", "Уведомления о ручной проверке", paragraph("Подключённый Slack может сообщать о создании и завершении этого рана. Получение самого события падения TeamCity пока не реализовано."), articles("slack", "execute-run")),
    ] },
  { id: "jenkins", title: "Jenkins", group: "integrations", status: "planned",
    description: "Как учитывать сборки Jenkins в Falcon и какие возможности пока не реализованы.",
    keywords: ["Jenkins", "дженкинс", "job", "pipeline", "автотесты", "JUnit"], related: ["create-run", "test-suites"],
    sections: [
      section("status", "Статус: скоро", note("Коннектор ещё недоступен", "В каталоге Falcon Jenkins помечен «Скоро». Через эту карточку нельзя запустить job, принять pipeline webhook или импортировать JUnit-отчёт.")),
      section("today", "Зафиксировать ручное тестирование", steps(
        ["Выберите job и build", "Уточните версию, которая развёрнута на стенде, и зафиксируйте номер сборки."],
        ["Создайте ран Falcon", "Выберите нужный сьют и окружение. В поле сборки укажите идентификатор проверяемого артефакта."],
        ["Выполните проверку", "В случае ошибки приложите ссылку на job/build и нужный фрагмент лога к дефекту. Ссылка служит контекстом, а не подключением автоматической синхронизации."])),
      section("scope", "Автотесты и ручной результат", paragraph("Falcon хранит результаты выполненной в нём проверки. Наличие типа кейса или ссылки на Jenkins не означает, что runner автотестов запущен. Доступная событийная автоматизация описана в статье GitHub."), articles("github", "execute-run")),
    ] },
];
