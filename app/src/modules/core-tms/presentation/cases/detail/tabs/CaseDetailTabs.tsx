import type { TmsLocale } from "../../../../localization/model/locale";
import {
  inspectorTabAfterKey,
  inspectorTabsForMode,
  type InspectorTabId,
  type InspectorTabKey,
} from "../../inspector/model";
import inspector from "../../inspector/caseInspector.module.css";
import styles from "../../cases.module.css";

type Props = {
  locale: TmsLocale;
  active: InspectorTabId;
  tabsId: string;
  creating: boolean;
  onActive: (tab: InspectorTabId) => void;
};

export function CaseDetailTabs({ locale, active, tabsId, creating, onActive }: Props) {
  const ru = locale === "ru";
  const labels: Record<InspectorTabId, string> = {
    overview: ru ? "Общее" : "General",
    comments: ru ? "Комментарии" : "Comments",
    files: ru ? "Вложения" : "Attachments",
    activity: ru ? "История" : "Change history",
  };
  const tabs = inspectorTabsForMode(creating);
  return <div
    className={`${styles.detailTabs} ${inspector.tabs}`}
    role="tablist"
    aria-label={ru ? "Разделы кейса" : "Case sections"}
    onKeyDown={(event) => {
      if (creating || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      const next = inspectorTabAfterKey(active, event.key as InspectorTabKey);
      onActive(next);
      requestAnimationFrame(() => document.getElementById(`${tabsId}-${next}`)?.focus());
    }}
  >
    {tabs.map((tab) => <button
      id={`${tabsId}-${tab}`}
      key={tab}
      type="button"
      role="tab"
      tabIndex={active === tab ? 0 : -1}
      aria-selected={active === tab}
      aria-controls={`${tabsId}-panel`}
      className={active === tab ? styles.detailTabActive : ""}
      onClick={() => onActive(tab)}
    >{labels[tab]}</button>)}
  </div>;
}
