import { articles, code, paragraph, section, type DocArticle } from "../../model/article";
import { configurationPrompts } from "./configuration/configuration";
import { defectPrompts } from "./defects/defects";
import { reportingPrompts } from "./reporting/reporting";
import { productDocPrompts } from "./product-docs/product-docs";
import { repositoryPrompts } from "./repository/repository";
import { runPrompts } from "./runs/runs";
import { webQaPrompts } from "./web-qa/web-qa";

const topics = [repositoryPrompts, productDocPrompts, runPrompts, webQaPrompts, defectPrompts, reportingPrompts, configurationPrompts];
const overview: DocArticle = {
  id: "codex-prompts",
  title: "Сценарии для Codex",
  description: "Скопируйте готовый запрос для Codex и подставьте данные своего рабочего пространства Falcon.",
  group: "codex-prompts",
  keywords: ["Codex", "сценарии", "промпт", "примеры", "шаблоны", "QA", "Falcon"],
  related: ["codex-web-qa", ...topics.map(topic => topic.id)],
  sections: [
    section("start", "Как использовать готовый запрос",
      paragraph("Подключите Falcon в Codex, откройте подходящий раздел и скопируйте запрос. Замените текст в квадратных скобках на свой проект, ссылку или ожидаемый результат. Вставьте готовый запрос в чат Codex."),
      paragraph("Укажите проект, задачу и результат, который можно проверить. Если нужно внести изменения, уточните, что разрешено менять и что вы хотите сначала согласовать. Если доступ нужно обновить, войдите через форму подключения. Пароли и токены оставляйте за пределами запроса."),
      code("prompt", "Узнать, что доступно в вашем подключении",
        `Используй Falcon в рабочем пространстве [пространство] для проекта [проект]. Проверь, какие действия доступны через это подключение, и предложи три конкретных шага для [цель проверки]. По каждому укажи, что прочитаешь, что потребуется согласовать и какой результат я получу. Работай только на чтение.`)),
    section("topics", "Выбрать сценарий под задачу",
      paragraph("В каждом примере указано, когда он пригодится и какой результат вернёт Codex. Доступные действия зависят от выбранных проектов и разрешений подключения."),
      articles(...topics.map(topic => topic.id))),
  ],
};

export const codexPromptArticles: readonly DocArticle[] = [overview, ...topics];
