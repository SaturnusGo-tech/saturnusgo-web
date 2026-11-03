import { walkthrough, type ScreenshotStep } from "../../../../model/visual/walkthrough";

const shot = (file: string, height: number, title: string, instruction: string, result: string, alt: string): ScreenshotStep => ({
  title, instruction, result,
  image: { src: `/falcon/docs/2026-11-ru/codex-desktop-${file}-user20261103.jpg`, width: 2880, height, alt },
});

export const codexDesktopWalkthrough = walkthrough("Приложение Codex: Plugins → MCPs → Authenticate", [
  shot("add-server", 1794, "В Codex: Plugins → Add → Add MCP server",
    "В **приложении Codex на компьютере** откройте **Settings**, затем слева **Plugins**. Нажмите **Add** справа сверху и выберите **Add MCP server**. Это настройки Codex, а не сайт Falcon и не карточка плагина Falcon по кнопке Manage.",
    "На предоставленном снимке показано настоящее меню Add. Нужный пункт называется **Add MCP server**. Выбранная на снимке вкладка Apps не означает, что для подключения надо создавать приложение или ещё один плагин.",
    "Настройки Codex → Plugins: открыто меню Add, в нём виден пункт Add MCP server."),
  shot("transport", 1800, "Переключите Type с STDIO на Streamable HTTP",
    "В форме **Connect to a custom MCP** введите имя сервера компании в **Name**. Нажмите **Streamable HTTP** справа от **STDIO**. После переключения вставьте **Server URL** из настроек своей компании в Falcon. Bearer token, переменные токена и Headers для OAuth оставьте пустыми. Сохраните; перезапускайте Codex, только если он попросит.",
    "Снимок показывает форму ДО переключения: здесь **выбран STDIO**. Для Falcon сначала выберите **Streamable HTTP**. Видимые Command to launch, Arguments и переменные STDIO заполнять не нужно. Форма HTTP с полем URL на этом снимке ещё не открыта.",
    "Форма Connect to a custom MCP в Codex: выбран STDIO, рядом доступен переключатель Streamable HTTP."),
  shot("authenticate", 1788, "Во вкладке MCPs нажмите Authenticate своего сервера",
    "Всё ещё **в приложении Codex** откройте **Settings → Plugins → MCPs** — вкладку рядом с Plugins и Apps. В разделе **Servers** найдите сохранённое имя. На примере это **falcon-umbrella**. Нажмите **Authenticate** справа в ЭТОЙ строке. В браузере войдите в Falcon своей компании, проверьте проекты и разрешения перед согласием.",
    "В реальной строке сервера видны **Auto**, **Authenticate**, шестерёнка и включённый тумблер. Кнопка входа находится здесь, а не в карточке навыков плагина Falcon. После согласия вернитесь в Codex, начните новый чат и проверьте компанию и доступные проекты до поручения изменений.",
    "Codex Plugins → MCPs → Servers: строка falcon-umbrella с кнопкой Authenticate справа."),
  shot("settings-search", 1800, "Если используете поиск настроек — выберите результат Plugins",
    "Прямой путь — **Settings → Plugins**. Если вместо этого вводите MCP server в поиске настроек, выбирайте **MCP servers** с подписью **Plugins**. Не выбирайте **MCP server — Hooks** и **Configure MCP servers — Keyboard shortcuts**: это другие настройки.",
    "Снимок показывает причину путаницы: поиск находит несколько похожих пунктов, а справа открыт Keyboard shortcuts. Нужен результат с подписью Plugins. После перехода выберите вкладку **MCPs** и найдите строку своего сервера.",
    "Поиск настроек Codex: MCP servers с подписью Plugins отличается от результатов Hooks и Keyboard shortcuts."),
]);
