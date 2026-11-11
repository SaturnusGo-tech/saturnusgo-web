import type { LandingLocale } from '../../landing/localization/model/locale';

export const WORKFLOW_DURATION = 15_700;
export const WORKFLOW_SEND_AT = 4_400;
export const WORKFLOW_STAGE_AT = [5_100, 6_950, 8_800, 10_650, 12_500] as const;

export function workflowFrame(elapsed: number, prompt: string) {
  const progress = Math.max(0, Math.min(1, (elapsed - 500) / 3_500));
  const characters = Array.from(prompt);
  return {
    prompt: characters.slice(0, Math.ceil(characters.length * progress)).join(''),
    sent: elapsed >= WORKFLOW_SEND_AT,
    stage: WORKFLOW_STAGE_AT.reduce((active, start, index) => elapsed >= start ? index : active, -1),
    complete: elapsed >= WORKFLOW_DURATION,
  };
}

export const workflowStory = {
  en: {
    title: 'One request.\nA connected quality workflow.',
    body: 'Give Codex the context. Keep requirements, test cases, documentation and release evidence together in Falcon.',
    example: 'An example workflow',
    prompt: 'Review the landing page cases, make the coverage consistent, and write a clear product guide. Link everything in Falcon.',
    placeholder: 'Ask Codex to work in Falcon',
    sent: 'Review the landing · update coverage · write the guide',
    stages: ['Requirements', 'Coverage', 'Test cases', 'Documentation', 'Release evidence'],
    stageDetail: ['Read the context', 'Find the gaps', 'Refine the cases', 'Write the guide', 'Connect the work'],
    files: ['Landing requirements', 'Coverage map', 'Updated test cases', 'Product guide', 'Release checklist'],
    working: 'Working in Falcon',
    complete: 'One connected workspace',
    replay: 'Replay workflow',
    pause: 'Pause animation',
    resume: 'Resume animation',
    requirements: {
      title: 'A clear starting point',
      lead: 'Understand the product before changing the tests.',
      quote: 'A visitor can explore the product, switch language and theme, then open Falcon.',
      items: ['Keep the visitor’s place when the theme changes.', 'Explain the complete flow from coverage to release.', 'Keep the same meaning in English and Russian.'],
    },
    coverage: {
      title: 'Coverage with a purpose',
      lead: 'Turn requirements into scenarios a tester can follow.',
      columns: ['Scenario', 'Expected behaviour'],
      rows: [['Change theme', 'Content and screenshots follow the theme'], ['Change language', 'Navigation keeps its place and meaning'], ['Open Falcon', 'The visitor reaches the right sign-in flow']],
    },
    cases: {
      title: 'Switch theme without losing your place',
      before: 'Preconditions',
      beforeText: 'The landing page is open. A theme is already selected.',
      steps: ['Scroll to the documentation section.', 'Switch from dark to light mode.', 'Check the screenshots and the current scroll position.'],
      result: 'The content stays in place. The screenshots match the selected theme.',
    },
    docs: {
      title: 'From requirements to release',
      lead: 'The guide explains the work, not just the interface.',
      heading: 'Keep the context connected',
      paragraph: 'Link the requirement to its test cases. Add a run snapshot when the checks have been executed.',
      highlight: 'A shared source of truth for the next person.',
      items: ['Write clear prerequisites and expected results.', 'Capture decisions beside the evidence.'],
    },
    evidence: {
      title: 'Ready for the next check',
      lead: 'Everything prepared in the same workspace.',
      rows: [['Requirements', 'Referenced'], ['Test cases', 'Updated'], ['Product guide', 'Linked'], ['Run evidence', 'Added after execution']],
      note: 'Execution results stay attached to the run that produced them.',
    },
  },
  ru: {
    title: 'Один запрос.\nЦелый процесс проверки.',
    body: 'Передайте Codex контекст. Требования, тест-кейсы, документация и результаты проверки останутся связаны в Falcon.',
    example: 'Пример рабочего процесса',
    prompt: 'Пересмотри тест-кейсы лендинга, сделай покрытие последовательным и напиши понятное руководство по продукту. Свяжи всё в Falcon.',
    placeholder: 'Попросите Codex поработать в Falcon',
    sent: 'Проверить лендинг · обновить кейсы · написать руководство',
    stages: ['Требования', 'Покрытие', 'Тест-кейсы', 'Документация', 'Релиз'],
    stageDetail: ['Изучить контекст', 'Найти пробелы', 'Уточнить проверки', 'Описать продукт', 'Связать результат'],
    files: ['Требования к лендингу', 'Карта покрытия', 'Обновлённые кейсы', 'Руководство', 'Чек-лист релиза'],
    working: 'Работа в Falcon',
    complete: 'Всё связано в одном пространстве',
    replay: 'Посмотреть ещё раз',
    pause: 'Приостановить анимацию',
    resume: 'Продолжить анимацию',
    requirements: {
      title: 'Понятная отправная точка',
      lead: 'Сначала понять продукт, затем менять проверки.',
      quote: 'Посетитель может изучить продукт, сменить язык и тему, затем открыть Falcon.',
      items: ['Сохранять место на странице при смене темы.', 'Показать полный процесс: от покрытия до релиза.', 'Сохранить смысл на русском и английском.'],
    },
    coverage: {
      title: 'Покрытие со смыслом',
      lead: 'Превратить требования в понятные сценарии проверки.',
      columns: ['Сценарий', 'Ожидаемое поведение'],
      rows: [['Смена темы', 'Контент и скриншоты соответствуют теме'], ['Смена языка', 'Навигация сохраняет место и смысл'], ['Открытие Falcon', 'Посетитель видит нужный способ входа']],
    },
    cases: {
      title: 'Смена темы без потери места на странице',
      before: 'Предусловия',
      beforeText: 'Лендинг открыт. Тема уже выбрана.',
      steps: ['Прокрутить до раздела документации.', 'Сменить тёмную тему на светлую.', 'Проверить скриншоты и позицию прокрутки.'],
      result: 'Контент остаётся на месте. Скриншоты соответствуют выбранной теме.',
    },
    docs: {
      title: 'От требований до релиза',
      lead: 'Руководство объясняет работу, а не только интерфейс.',
      heading: 'Сохранить контекст',
      paragraph: 'Свяжите требование с тест-кейсами. Добавьте снимок прогона после выполнения проверок.',
      highlight: 'Общий источник знаний для следующего участника.',
      items: ['Описать предусловия и ожидаемый результат.', 'Сохранить решения рядом с результатами.'],
    },
    evidence: {
      title: 'Всё для следующей проверки',
      lead: 'Подготовлено в одном рабочем пространстве.',
      rows: [['Требования', 'Указаны'], ['Тест-кейсы', 'Обновлены'], ['Руководство', 'Связано'], ['Результаты прогона', 'После выполнения']],
      note: 'Результаты остаются связаны с прогоном, в котором они получены.',
    },
  },
} satisfies Record<LandingLocale, unknown>;
