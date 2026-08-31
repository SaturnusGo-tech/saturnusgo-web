import {
  Archive, ArrowLeft, Check, Copy, Link2, ListChecks, Maximize2,
  Minimize2, Pencil, Play, RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Activity, TestCaseRevision, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../localization/model/locale";
import { buildCaseDeepLink } from "../../../test-cases/navigation/case-deep-link";
import { CaseOverview } from "./CaseOverview";
import { CaseContextTab, type DetailTab } from "./tabs/CaseContextTab";
import styles from "../cases.module.css";

type Props = {
  locale: TmsLocale;
  languageTag: string;
  testCase?: TestCaseSummary;
  revision: TestCaseRevision | null;
  linkIds: string[];
  activity: Activity[];
  selectedFolder: string;
  onNew: (folder?: string) => void;
  onEdit: () => void;
  onClone: () => void;
  onArchive: () => void;
  onRunCase: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose?: () => void;
};

export function CaseDetailPanel(props: Props) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const [linkCopied, setLinkCopied] = useState(false);
  const ru = props.locale === "ru";
  useEffect(() => {
    setTab("overview");
    setLinkCopied(false);
  }, [props.testCase?.id]);

  async function copyLink() {
    if (!props.testCase) return;
    const link = buildCaseDeepLink(window.location.href, {
      caseId: props.testCase.id,
      projectId: props.testCase.projectId,
    });
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(link);
    } catch {
      const field = document.createElement("textarea");
      field.value = link;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1800);
  }
  if (!props.testCase) {
    return <div className={styles.detailPanelInner}>
      <div className={styles.detailEmpty}><ListChecks size={28} /><strong>{ru ? "Выберите тест-кейс" : "Select a test case"}</strong><span>{ru ? "Здесь появятся свойства, шаги и история." : "Properties, steps, and history will appear here."}</span><button className={styles.primaryButton} onClick={() => props.onNew(props.selectedFolder)}>{ru ? "Создать кейс" : "Create case"}</button></div>
    </div>;
  }
  if (!props.revision) return null;
  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: "overview", label: ru ? "Обзор" : "Overview" },
    { id: "activity", label: ru ? "История" : "Activity" },
    { id: "files", label: ru ? "Файлы" : "Files" },
  ];
  return <div className={styles.detailPanelInner}>
    <div className={styles.detailToolbar}>
      <div className={styles.detailPrimaryActions}>
        {props.onClose && <button className={styles.mobileBackButton} onClick={props.onClose} aria-label={ru ? "Вернуться к списку" : "Back to list"}><ArrowLeft size={16} /></button>}
        <button className={styles.runButton} onClick={props.onRunCase}><Play size={14} />{ru ? "Запустить" : "Run"}</button>
      </div>
      <div className={styles.detailSecondaryActions}>
        <button className={styles.iconButton} onClick={copyLink} title={ru ? "Копировать ссылку" : "Copy link"} aria-label={linkCopied ? (ru ? "Ссылка скопирована" : "Link copied") : (ru ? "Копировать ссылку на кейс" : "Copy case link")}>{linkCopied ? <Check size={15} /> : <Link2 size={15} />}</button>
        <button className={styles.iconButton} onClick={props.onToggleFullscreen} title={props.fullscreen ? (ru ? "Выйти из полного экрана" : "Exit full screen") : (ru ? "Открыть на весь экран" : "Open full screen")} aria-label={props.fullscreen ? (ru ? "Выйти из полного экрана" : "Exit full screen") : (ru ? "Открыть кейс на весь экран" : "Open case full screen")} aria-pressed={props.fullscreen}>{props.fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>
        <button className={styles.iconButton} onClick={props.onEdit} title={ru ? "Изменить" : "Edit"} aria-label={ru ? "Изменить кейс" : "Edit case"}><Pencil size={15} /></button>
        <button className={styles.iconButton} onClick={props.onClone} title={ru ? "Клонировать" : "Clone"} aria-label={ru ? "Клонировать кейс" : "Clone case"}><Copy size={15} /></button>
        <button className={styles.iconButton} onClick={props.onArchive} title={props.testCase.archivedAt ? (ru ? "Восстановить" : "Restore") : (ru ? "В архив" : "Archive")} aria-label={props.testCase.archivedAt ? (ru ? "Восстановить кейс" : "Restore case") : (ru ? "Архивировать кейс" : "Archive case")}>{props.testCase.archivedAt ? <RotateCcw size={15} /> : <Archive size={15} />}</button>
      </div>
      <span className={styles.visuallyHidden} role="status" aria-live="polite">{linkCopied ? (ru ? "Ссылка на тест-кейс скопирована" : "Test case link copied") : ""}</span>
    </div>
    <div className={styles.detailTitle}><span className={styles.detailTypeIcon}><ListChecks size={18} /></span><h2>{props.revision.title}</h2></div>
    <div className={styles.detailTabs} role="tablist" aria-label={ru ? "Разделы кейса" : "Case sections"}>
      {tabs.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} aria-controls="case-detail-content" className={tab === item.id ? styles.detailTabActive : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}
    </div>
    <div className={styles.detailScroll} id="case-detail-content" role="tabpanel">
      {tab === "overview" ? <CaseOverview locale={props.locale} testCase={props.testCase} revision={props.revision} /> : <CaseContextTab tab={tab} locale={props.locale} languageTag={props.languageTag} testCase={props.testCase} revision={props.revision} linkIds={props.linkIds} activity={props.activity} />}
    </div>
  </div>;
}
