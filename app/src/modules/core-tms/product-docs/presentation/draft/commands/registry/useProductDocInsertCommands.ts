"use client";

import { applyListType$, convertSelectionToNode$, insertCodeBlock$, insertDirective$, insertTable$, insertThematicBreak$, usePublisher } from "@mdxeditor/editor";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import type { RangeSelection } from "lexical";
import {
  ChartNoAxesColumnIncreasing, ChevronsUpDown, CircleAlert, CircleDot, CirclePlay, CodeXml, Film, Heading1, Heading2, Heading3,
  Heading4, Image, Info, Lightbulb, List, ListChecks, ListOrdered, Minus, Paperclip, Quote, Radical, Route, Table2, TriangleAlert,
  FileUp, type LucideIcon,
} from "lucide-react";
import type { TmsLocale } from "../../../../../localization/model/locale";
import { useDashboardPicker } from "../../../dashboard/editor/dashboardEditor";
import { useRunEvidencePicker } from "../../../run/editor/runEditor";
import { productDocRadioName } from "../../blocks/radio/radioOptions";
import { productDocOpenAttachmentPicker$ } from "../../media/input/ProductDocImageInput";
import { useProductDocGif } from "../../media/gif/ProductDocGif";

type Group = "headings" | "lists" | "media" | "blocks" | "more";
export type ProductDocInsertCommand = {
  id: string;
  label: string;
  group: Group;
  Icon: LucideIcon;
  run(selection?: RangeSelection | null): void;
  terms?: string;
  inTable?: boolean;
};

export function productDocCommandMatches(command: ProductDocInsertCommand, query: string) {
  const normalized = query.trim().toLowerCase();
  return command.id.includes(normalized) || command.label.toLowerCase().includes(normalized) || command.terms?.includes(normalized);
}

export function useProductDocInsertCommands(locale: TmsLocale, onImport?: () => void): ProductDocInsertCommand[] {
  const ru = locale === "ru";
  const changeBlock = usePublisher(convertSelectionToNode$);
  const list = usePublisher(applyListType$);
  const attach = usePublisher(productDocOpenAttachmentPicker$);
  const table = usePublisher(insertTable$);
  const code = usePublisher(insertCodeBlock$);
  const directive = usePublisher(insertDirective$);
  const divider = usePublisher(insertThematicBreak$);
  const chooseDashboard = useDashboardPicker();
  const chooseRunEvidence = useRunEvidencePicker();
  const chooseGif = useProductDocGif();
  const callouts = [
    { id: "note", label: ru ? "Примечание" : "Note", Icon: Info },
    { id: "tip", label: ru ? "Совет" : "Tip", Icon: Lightbulb },
    { id: "info", label: ru ? "Информация" : "Information", Icon: Info },
    { id: "caution", label: ru ? "Предупреждение" : "Caution", Icon: TriangleAlert },
    { id: "danger", label: ru ? "Важное" : "Important", Icon: CircleAlert },
  ];

  return [
    ...([Heading1, Heading2, Heading3] as const).map((Icon, index): ProductDocInsertCommand => {
      const level = index + 1 as 1 | 2 | 3;
      return { id: `h${level}`, label: ru ? `Заголовок ${level}` : `Heading ${level}`, group: "headings", Icon,
        terms: `heading ${level}`, run: () => changeBlock(() => $createHeadingNode(`h${level}`)) };
    }),
    { id: "bulleted", label: ru ? "Маркированный список" : "Bulleted list", group: "lists", Icon: List,
      terms: "bullet unordered list", run: () => list("bullet") },
    { id: "numbered", label: ru ? "Нумерованный список" : "Numbered list", group: "lists", Icon: ListOrdered,
      terms: "ordered list", run: () => list("number") },
    { id: "checklist", label: ru ? "Чек-лист" : "Checklist", group: "lists", Icon: ListChecks,
      terms: "task list чек лист", run: () => list("check") },
    { id: "media", label: ru ? "Вставить медиа…" : "Insert media…", group: "media", Icon: Image,
      terms: "image picture video audio изображение фото видео", run: (selection) => attach({ mediaOnly: true, selection }) },
    { id: "attachment", label: ru ? "Прикрепить файлы…" : "Attach files…", group: "media", Icon: Paperclip,
      terms: "attachment file upload вложение файл загрузить", run: (selection) => attach(selection) },
    { id: "code", label: ru ? "Блок кода" : "Code block", group: "blocks", Icon: CodeXml, run: () => code({}) },
    { id: "diagram", label: ru ? "Диаграмма" : "Diagram", group: "blocks", Icon: Route,
      terms: "mermaid диаграмма схема", run: () => code({ language: "mermaid", code: "" }) },
    { id: "math", label: ru ? "Формула LaTeX" : "LaTeX math block", group: "blocks", Icon: Radical,
      terms: "math latex equation математика", run: () => code({ language: "latex", code: "" }) },
    { id: "collapse", label: ru ? "Сворачиваемый раздел" : "Collapsible section", group: "blocks", Icon: ChevronsUpDown,
      terms: "collapse toggle details раскрывающийся спойлер", run: () => directive({ type: "containerDirective", name: "falcon-collapse" }) },
    { id: "quote", label: ru ? "Цитата" : "Blockquote", group: "blocks", Icon: Quote,
      terms: "quote quotation", run: () => changeBlock($createQuoteNode) },
    { id: "table", label: ru ? "Таблица" : "Table", group: "more", Icon: Table2, run: () => table({ rows: 3, columns: 3 }) },
    ...(chooseDashboard ? [{ id: "dashboard", label: ru ? "Дашборд" : "Dashboard", group: "more" as const,
      Icon: ChartNoAxesColumnIncreasing, run: chooseDashboard }] : []),
    ...(chooseRunEvidence ? [{ id: "run", label: ru ? "Результаты прогона" : "Run evidence", group: "more" as const,
      Icon: CirclePlay, run: chooseRunEvidence }] : []),
    { id: "gif", label: "GIF", group: "more", Icon: Film, run: chooseGif, inTable: true },
    { id: "radio", label: ru ? "Один вариант" : "Radio options", group: "more", Icon: CircleDot,
      run: () => directive({ type: "containerDirective", name: productDocRadioName }) },
    { id: "divider", label: ru ? "Разделитель" : "Divider", group: "more", Icon: Minus, run: () => divider() },
    ...callouts.map((item): ProductDocInsertCommand => ({ ...item, group: "more",
      run: () => directive({ type: "containerDirective", name: item.id }) })),
    { id: "h4", label: ru ? "Заголовок 4" : "Heading 4", group: "more", Icon: Heading4,
      terms: "heading 4", run: () => changeBlock(() => $createHeadingNode("h4")) },
    ...(onImport ? [{ id: "import", label: ru ? "Текст из файла…" : "Text from file…", group: "more" as const,
      Icon: FileUp, run: onImport, inTable: true }] : []),
  ];
}
