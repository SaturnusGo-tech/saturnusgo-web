import { Tab, Tabs } from "@heroui/react";
import type { ReactNode } from "react";
import layout from "./case-detail-tabs.module.css";
import { transitionContent } from "../../../workspace/motion/transition/content-transition";
import type { TmsLocale } from "../../../../localization/model/locale";
import {
  inspectorTabsForMode,
  type InspectorTabId,
} from "../../inspector/model";

type Props = {
  locale: TmsLocale;
  active: InspectorTabId;
  tabsId: string;
  creating: boolean;
  actions?: ReactNode;
  fileCount?: number;
  activityCount?: number;
  onActive: (tab: InspectorTabId) => void;
};

export function CaseDetailTabs({ locale, active, tabsId, creating, fileCount = 0, activityCount = 0, actions, onActive }: Props) {
  const ru = locale === "ru";
  const labels: Record<InspectorTabId, string> = {
    overview: ru ? "Общее" : "General",
    files: ru ? "Вложения" : "Attachments",
    activity: ru ? "История" : "Change history",
  };
  const tabs = inspectorTabsForMode(creating);
  return <div className={layout.row}>
    <Tabs aria-label={ru ? "Разделы кейса" : "Case sections"} selectedKey={active}
      classNames={{ base: layout.base, tabList: layout.tabs, tab: layout.tab, tabContent: layout.content, cursor: layout.cursor }}
      motionProps={{ transition: { type: "spring", duration: .3, bounce: 0 } }}
      onSelectionChange={(key) => {
        const tab = tabs.find((item) => item === key);
        if (tab) transitionContent(() => onActive(tab));
      }}>
      {tabs.map((tab) => {
        const count = tab === "files" ? fileCount : tab === "activity" ? activityCount : 0;
        return <Tab key={tab} id={`${tabsId}-${tab}`} aria-controls={`${tabsId}-panel`}
          title={<>{labels[tab]}{count > 0 && <span className={layout.badge}>{count}</span>}</>} />;
      })}
    </Tabs>
    {actions && <div className={layout.actions}>{actions}</div>}
  </div>;
}
