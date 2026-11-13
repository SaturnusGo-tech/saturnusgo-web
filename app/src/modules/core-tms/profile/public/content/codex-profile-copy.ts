export function codexProfileCopy(ru:boolean) {
 return ru?{
  introduction:'Агент QA в Falcon',
  bio:`Привет, я **Codex** — твой AI-напарник по QA в Falcon. Помогаю разобраться в продукте, найти пробелы в покрытии и довести проверки до понятного результата. Опиши задачу обычными словами — я начну с того, что уже есть у команды.

### Сначала — контекст

- **Исследую продукт.** Читаю требования, существующие кейсы, прошлые результаты, доступные вложения и код. Сопоставляю источники и отмечаю вопросы, на которые пока нет ответа.
- **Нахожу, что проверить.** Ищу связанные сценарии, граничные условия и недостающее покрытие, чтобы сохранять полезные проверки и дополнять их по делу.

### От задачи — к проверке

- **Работаю с тест-кейсами.** Создаю и уточняю кейсы, упорядочиваю папки, проверяю данные импорта и экспортирую выбранное покрытие.
- **Готовлю прогоны.** Подбираю проверки под задачу. Когда выполнение разрешено, провожу поддерживаемые проверки и сохраняю фактические результаты с доказательствами.

### Знания остаются в Falcon

- **Пишу документацию.** Связываю объяснения, диаграммы и источники, чтобы следующему человеку было проще продолжить работу.
- **Разбираю результат.** Помогаю зарегистрировать дефекты, связать доказательства и понять, что требует внимания перед следующим прогоном.

*Работаю в пределах проектов и прав моего подключения. Подготовка прогона ещё не означает, что проверки выполнены. Моя активность и достижения отражают записанные действия.*`,
 }:{
  introduction:'QA agent in Falcon',
  bio:`Hi, I’m **Codex** — your AI teammate for QA in Falcon. I help you understand the product, find gaps in coverage and turn checks into results your team can use. Describe the task in your own words — I’ll start with what your team already knows.

### First, the context

- **Investigate the product.** I read requirements, existing cases, previous results, available attachments and code. I compare sources and flag questions that still need an answer.
- **Find what to check.** I look for related scenarios, boundary conditions and missing coverage, keeping useful checks and adding what the task needs.

### From a task to a check

- **Work with test cases.** I create and refine cases, organize folders, validate imports and export selected coverage.
- **Prepare test runs.** I select checks for the task. When execution is authorized, I carry out supported checks and retain their actual results and evidence.

### Keep the knowledge in Falcon

- **Write documentation.** I connect explanations, diagrams and sources so the next person can pick up the work.
- **Review the outcome.** I help file defects, link evidence and identify what needs attention before the next run.

*I work within the projects and permissions granted to my connection. Preparing a run does not mean its checks have been executed. My activity and achievements reflect recorded actions.*`,
 };
}
