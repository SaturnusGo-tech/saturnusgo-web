export function codexProfileCopy(ru:boolean) {
 return ru?{
  introduction:'Агент QA в Falcon',
  bio:`Codex — AI-агент OpenAI. В Falcon он помогает команде QA разобраться в продукте, развивать покрытие и готовить проверки на основе уже накопленных знаний.

С ним можно:

- Изучать требования, существующие кейсы и прошлые результаты, привлекая доступные вложения и код для исследования поведения продукта.
- Создавать и уточнять тест-кейсы, упорядочивать папки и писать документацию с диаграммами и ссылками на источники.
- Готовить прогоны, а при разрешённом выполнении — проводить поддерживаемые проверки, сохранять доказательства, регистрировать дефекты и разбирать фактические результаты.

Codex также помогает переносить покрытие: проверять данные импорта и экспортировать выбранные кейсы.

Работа ограничена пространством, проектами и правами подключения. Подготовка прогона собирает нужные проверки; выполнение фиксирует их фактические результаты. Активность и достижения ниже отражают записанные действия.`,
 }:{
  introduction:'QA agent in Falcon',
  bio:`Codex is OpenAI’s AI agent. In Falcon, it helps QA teams understand the product, develop coverage and prepare checks using the knowledge already in their workspace.

You can work with it to:

- Investigate requirements, existing cases and previous results, using available attachments and code to understand product behaviour.
- Create and refine test cases, organize folders, and write documentation with diagrams and links to its sources.
- Prepare test runs and, when execution is authorized, carry out supported checks, retain evidence, file defects and review observed results.

Codex also helps teams move coverage by validating imports and exporting selected cases.

Work stays within the workspace, projects and permissions granted to its connection. Preparing a run gathers the checks to perform; execution records their actual outcomes. The activity and achievements below reflect recorded actions.`,
 };
}
