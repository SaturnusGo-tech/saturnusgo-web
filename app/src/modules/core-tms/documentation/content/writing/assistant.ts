import { articles, bullets, paragraph, section, steps, type DocArticle } from "../../model/article";

export const writingAssistantArticle: DocArticle = {
  id: "falcon-ai-writing", title: "Falcon AI и цветной маркер", group: "cases",
  description: "Улучшайте текст и Markdown в текущем поле, проверяйте результат перед заменой и отмечайте важные фрагменты цветом. English guide included.",
  keywords: ["Falcon AI", "исправить ошибки", "улучшить текст", "Markdown", "маркер", "цвет", "выделение", "сфера", "highlight", "writing", "improve", "English", "H1", "H2", "H3", "заголовки"],
  related: ["create-test-case", "edit-test-case", "portfolios"],
  sections: [
    section("open", "Выберите текст и откройте Falcon AI", paragraph("Начните редактирование описания, предусловий, действия или ожидаемого результата. Те же инструменты доступны в описаниях проектов и портфелей и в плане тестирования. Голубая сфера **Спросить Falcon AI** находится первой на панели Markdown, слева от Undo."),
      paragraph("Чтобы изменить слово или фрагмент, сначала выделите его. Без выделения Falcon AI работает со всем текстом текущего поля. Подпись в открывшемся окне показывает область изменения: **Выделенный текст** или **Весь текст поля**.")),
    section("request", "Опишите нужное изменение", steps(
      ["Выберите действие", "Нажмите **Улучшить текст** или **Исправить ошибки**. Либо напишите свой запрос: «Оформи заголовки и вложенные списки в Markdown», «Сократи описание, сохранив условия» или «Сформулируй последовательность действий по этому тексту»."],
      ["Отправьте запрос", "Нажмите стрелку возле запроса или Ctrl+Enter / ⌘Enter. Пока готовится ответ, виден индикатор загрузки. Кнопка **Остановить** прекращает ожидание."],
      ["Проверьте предложение", "Ответ показывается с Markdown-форматированием. Сверьте смысл, условия проверки и ожидаемый результат. Кнопка **Иначе** позволяет получить другой вариант."])),
    section("replace", "Примените результат", paragraph("Нажмите **Заменить выделенное** или **Заменить текст**. Предложение попадёт в черновик выбранного поля. Закрытие окна оставляет исходный текст. Если вы уже изменили поле после запроса, Falcon предложит начать новый запрос, чтобы сохранить ваши правки."),
      paragraph("Вернуть текст можно через **Undo**, Ctrl+Z или ⌘Z. В поле сценария сначала вернитесь к редактированию и используйте сочетание клавиш. Затем сохраните кейс, проект или портфель обычной кнопкой сохранения. Текст сценария меняется внутри выбранного поля; новые самостоятельные шаги добавляются через **Добавить шаг**.")),
    section("marker", "Отметьте важное цветом", steps(
      ["Выделите текст", "Выберите букву, слово, фразу или заголовок и нажмите **Маркер** на панели Markdown."],
      ["Выберите цвет", "Доступны жёлтый, голубой, зелёный, розовый и лиловый. Цвет виден сразу, до сохранения. Полупрозрачный штрих сочетается с жирным текстом, ссылками и другим форматированием. В сценарии после выбора цвета показывается отформатированный черновик; нажмите на него, чтобы продолжить редактирование."],
      ["Сохраните или уберите отметку", "Цвет остаётся после сохранения и повторного открытия поля, в светлой и тёмной теме. Чтобы снять отметку, выделите нужный фрагмент, откройте **Маркер** и нажмите **Убрать выделение**."])),
    section("headings", "Заголовки H1, H2 и H3", paragraph("Поставьте курсор в нужный абзац и выберите **H1**, **H2** или **H3** на панели Markdown. Повторное нажатие того же уровня возвращает обычный текст. В сценарии кнопка меняет текущую или выделенные строки. Уровни заголовков различаются размером и сохраняются при повторном открытии поля."),
      paragraph("Falcon AI использует настоящие Markdown-заголовки, когда вы просите оформить структуру текста. Действие **Исправить ошибки** сохраняет текущие уровни заголовков.")),
    section("english-ai", "English · Ask Falcon AI", paragraph("Open an editable description, precondition, step action, expected result, project or portfolio description, or testing plan. The blue **Ask Falcon AI** sphere is the first Markdown toolbar button, before Undo. Select a word or passage to work on that fragment; with no selection, Falcon AI uses the entire current field. The panel confirms **Selected text** or **Entire field**."),
      steps(
        ["Describe the change", "Choose **Improve text** or **Fix mistakes**, or enter a custom instruction such as “Format this as Markdown headings and nested lists” or “Turn these notes into a clear sequence of actions”. Send with the arrow or Ctrl+Enter / ⌘Enter."],
        ["Review the result", "A loading indicator appears while the answer is prepared. **Stop** cancels the request. Read the formatted suggestion, check its meaning and expected behavior, or use **Try again** for another version."],
        ["Replace and save", "Use **Replace selection** or **Replace text** to update the field draft. Closing the panel keeps the original. Undo with **Undo**, Ctrl+Z or ⌘Z, then save the case, project or portfolio normally. For a step, return to editing before using the undo shortcut. Changing a step field does not add separate scenario steps."])),
    section("english-marker", "English · Colored highlights", bullets(
      "Select characters, a word, a passage or a heading and open **Highlight** on the Markdown toolbar.",
      "Choose yellow, blue, green, pink or purple. The translucent marker stroke works with bold text and links and remains readable in both themes.",
      "Highlights appear immediately in the draft and persist when the field is saved and reopened. Select marked text and choose **Remove highlight** to clear it."),
      paragraph("Use **H1**, **H2** or **H3** to format the current paragraph or selected scenario lines. Choose the active level again to return to plain text. Falcon AI preserves real Markdown heading levels; **Fix mistakes** keeps the existing structure."),
      articles("create-test-case", "edit-test-case", "portfolios")),
  ],
};
