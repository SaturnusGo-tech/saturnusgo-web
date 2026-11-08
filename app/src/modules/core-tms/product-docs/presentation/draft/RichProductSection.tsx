"use client";

import {
  MDXEditor, addTopAreaChild$, codeBlockPlugin, defaultSvgIcons,
  directivesPlugin, headingsPlugin, imagePlugin, linkDialogPlugin, linkPlugin, listsPlugin,
  markdownProcessingError$, markdownShortcutPlugin, quotePlugin, realmPlugin, tablePlugin, thematicBreakPlugin, toolbarPlugin,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { ChevronDown, Ellipsis, ImageIcon, Plus, Trash2 } from "lucide-react";
import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { productDocAttachmentDescriptor } from "../attachments/productDocAttachmentEditor";
import { DashboardPickerProvider, productDocDashboardDescriptor } from "../dashboard/editor/dashboardEditor";
import { RunEvidencePickerProvider, productDocRunDescriptor } from "../run/editor/runEditor";
import { productDocRadio } from "./blocks/radio/ProductDocRadio";
import { ProductDocCodeEditor } from "./blocks/ProductDocCodeEditor";
import { ProductDocStructuredBlock } from "./blocks/structured/ProductDocStructuredBlock";
import { productDocCollapseDescriptor, productDocCollapsePlugin } from "./blocks/collapse/ProductDocCollapse";
import { structuredBlockKind } from "../../domain/structured/structuredMarkdown";
import blockStyles from "./blocks/productDocBlocks.module.css";
import { productDocGifPlugin } from "./media/gif/ProductDocGif";
import { productDocImageOptions } from "./media/ProductDocImage";
import { productDocImageInputPlugin } from "./media/input/productDocImageInputPlugin";
import tableStyles from "./tables/tables.module.css";
import { productDocTableGuardPlugin } from "./tables/productDocTableGuard";
import { markdownEditorTranslation } from "../../../presentation/cases/inspector/markdown/translations/markdownEditorTranslation";
import type { TmsLocale } from "../../../localization/model/locale";
import { productDocChecklistPlugin } from "./checklist/productDocChecklist";
import { productDocCommandsPlugin } from "./commands/productDocCommands";
import { productDocFormattingPlugin } from "./formatting/productDocFormatting";
import { productDocLayoutsPlugin } from "./layouts/productDocLayouts";
import layoutStyles from "./layouts/layouts.module.css";
import { productDocSectionsPlugin } from "./sections/productDocSections";
import { productDocSelectionToolbarPlugin } from "./selection/ProductDocSelectionToolbar";
import { ProductDocToolbar } from "./toolbar/ProductDocToolbar";
import { productDocSmartPaste } from "./links/smart/productDocSmartPaste";
import { ProductDocLinkDialog, isProductDocLink } from "./links/ProductDocLinkDialog";
import { productDocCallout } from "./blocks/callout/productDocCallout";
import calloutStyles from "./blocks/callout/product-doc-callout.module.css";
import markerStyles from "../../../presentation/cases/inspector/markdown/highlight/highlight.module.css";
import styles from "./editor.module.css";

const Title = createContext<ReactNode>(null);
function PageTitle() { return useContext(Title); }
const pageTitlePlugin = realmPlugin({ init(realm) { realm.pub(addTopAreaChild$, PageTitle); } });

const russian: Record<string, string> = {
  "toolbar.blockTypes.paragraph": "Обычный текст",
  "toolbar.blockTypes.quote": "Цитата",
  "toolbar.blockTypes.heading": "Заголовок {{level}}",
  "toolbar.blockTypeSelect.selectBlockTypeTooltip": "Стиль текста",
  "toolbar.blockTypeSelect.placeholder": "Стиль текста",
  "toolbar.table": "Вставить таблицу",
  "toolbar.admonition": "Вставить примечание",
  "toolbar.image": "Вставить изображение",
  "admonitions.note": "Примечание",
  "admonitions.tip": "Совет",
  "admonitions.info": "Информация",
  "admonitions.caution": "Предупреждение",
  "admonitions.danger": "Важное",
};

export default function RichProductSection({
  markdown, title, label, placeholder, locale, disabled, editorRef, onChange, onValidity, onImport, onMediaBusy,
}: {
  markdown: string;
  title: ReactNode;
  label: string;
  placeholder: string;
  locale: TmsLocale;
  disabled: boolean;
  editorRef: RefObject<MDXEditorMethods | null>;
  onChange(value: string): void;
  onValidity(valid: boolean): void;
  onImport(): void;
  onMediaBusy(busy: boolean): void;
}) {
  const importFailed = useRef<() => boolean>(() => false);
  const observeImport = useMemo(() => realmPlugin({
    init(realm) {
      importFailed.current = () => realm.getValue(markdownProcessingError$) !== null;
    },
  }), []);
  const plugins = useMemo(() => [
    observeImport(),
    headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4] }),
    listsPlugin(),
    productDocChecklistPlugin(),
    quotePlugin(),
    tablePlugin(),
    productDocTableGuardPlugin(),
    imagePlugin(productDocImageOptions),
    productDocGifPlugin(),
    productDocImageInputPlugin({ onMediaBusy }),
    thematicBreakPlugin(),
    codeBlockPlugin({ codeBlockEditorDescriptors: [
      { priority: 10, match: (language) => Boolean(structuredBlockKind(language)), Editor: ProductDocStructuredBlock },
      { priority: 0, match: () => true, Editor: ProductDocCodeEditor },
    ] }),
    linkPlugin({ validateUrl: isProductDocLink }),
    productDocSmartPaste(),
    linkDialogPlugin({ LinkDialog: ProductDocLinkDialog }),
    markdownShortcutPlugin(),
    directivesPlugin({ directiveDescriptors: [
      productDocCallout, productDocDashboardDescriptor, productDocRunDescriptor, productDocRadio,
      productDocAttachmentDescriptor, productDocCollapseDescriptor,
    ] }),
    productDocCollapsePlugin(),
    productDocSectionsPlugin(),
    productDocFormattingPlugin(),
    productDocSelectionToolbarPlugin(),
    productDocCommandsPlugin(),
    productDocLayoutsPlugin(),
    toolbarPlugin({
      toolbarClassName: styles.toolbar,
      toolbarContents: () => <ProductDocToolbar locale={locale} onImport={onImport} />,
    }),
    pageTitlePlugin(),
  ], [locale, observeImport, onImport, onMediaBusy]);

  return <DashboardPickerProvider><RunEvidencePickerProvider><Title.Provider value={title}>
    <MDXEditor ref={editorRef} markdown={markdown} plugins={plugins}
      readOnly={disabled} className={`${styles.editor} ${tableStyles.tableAppearance}`}
      contentEditableClassName={`${styles.editorBody} ${layoutStyles.editorLayouts} ${blockStyles.editor} ${markerStyles.surface} ${calloutStyles.prose}`}
      placeholder={placeholder} suppressHtmlProcessing spellCheck
      iconComponentFor={(name) => {
        if (name === "arrow_drop_down") return <ChevronDown size={13} />;
        if (name === "add_photo") return <ImageIcon size={16} />;
        if (name === "add_column" || name === "add_row") return <Plus size={15} />;
        if (name === "delete_small") return <Trash2 size={14} />;
        if (name === "more_horiz") return <Ellipsis size={15} />;
        return defaultSvgIcons[name];
      }}
      translation={(key, fallback, vars) => {
        if (key === "contentArea.editableMarkdown") return label;
        if (key === "toolbar.blockTypeSelect.placeholder") return locale === "ru" ? "Обычный текст" : "Normal text";
        if (key === "toolbar.blockTypes.paragraph" && locale === "en") return "Normal text";
        return markdownEditorTranslation(locale, key, locale === "ru" ? russian[key] ?? fallback : fallback, vars);
      }}
      onError={() => onValidity(false)}
      onChange={(value, initialNormalize) => {
        if (initialNormalize && (markdown.trim() || !value.trim())) return;
        // The editor publishes a failed import fragment as Markdown in the same batch as the error.
        // Keep the previous complete document until both updates have settled.
        queueMicrotask(() => {
          if (importFailed.current()) return;
          onValidity(true);
          onChange(value);
        });
      }} />
  </Title.Provider></RunEvidencePickerProvider></DashboardPickerProvider>;
}
