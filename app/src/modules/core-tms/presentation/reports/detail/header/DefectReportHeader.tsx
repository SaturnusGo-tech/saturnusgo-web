import { Button, Tab, Tabs } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import { buildDefectDeepLink } from "../../../../defects/navigation/defect-deep-link";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import type { DefectRetest } from "../../../../runs/verification/state/defect/useDefectRetest";
import { CommentShareItem } from "../../../cases/collaboration/sharing/CommentShareItem";
import tabs from "../../../cases/detail/tabs/case-detail-tabs.module.css";
import inspector from "../../../cases/inspector/caseInspector.module.css";
import { DefectStatusIcon } from "../../../common/properties/defect/DefectStatusIcon";
import { transitionContent } from "../../../workspace/motion/transition/content-transition";
import { DefectRetestAction } from "../retest/DefectRetestAction";
import { DefectRetestPanel } from "../retest/DefectRetestPanel";
import { DefectReportDates } from "./dates/DefectReportDates";
import styles from "./defect-report-header.module.css";

export type DetailTab = "overview" | "attachments";

export function DefectReportHeader({ workspaceId, defect, retest, evidenceCount, tabsId, tab, onTabChange, onBack }: {
  workspaceId?: string;
  defect: Defect;
  retest?: DefectRetest;
  evidenceCount: number;
  tabsId: string;
  tab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
  onBack: () => void;
}) {
  const { locale, t } = useTmsLocale();
  const ru = locale === "ru";
  const reducedMotion = useReducedMotion();
  const back = t("reports.backToList");
  const status = localizedLabel(locale, defect.status);
  return <header className={styles.header}>
    <div className={styles.utility}>
      <div className={styles.identity}>
        <span className={styles.key}>{defect.key}</span>
        <span className={styles.status} data-status={defect.status} aria-label={`${t("reports.status")}: ${status}`}>
          <DefectStatusIcon status={defect.status} /><span>{status}</span>
        </span>
      </div>
      <div className={`${inspector.headerActions} ${styles.actions}`}>
        {retest && <DefectRetestAction retest={retest} />}
        <div className={styles.share}>
          <CommentShareItem key={defect.id} compact resource="defect" ru={ru} link={() => {
            const url = new URL(window.location.href);
            if (workspaceId) url.searchParams.set("workspaceId", workspaceId);
            return buildDefectDeepLink(url.href, { projectId: defect.projectId, defectId: defect.id, includeArchived: Boolean(defect.archivedAt) });
          }} />
        </div>
        <Button type="button" isIconOnly variant="light" disableRipple aria-label={back} title={back}
          className={`${inspector.iconButton} ${styles.back}`} onPress={onBack}>
          <X size={17} aria-hidden="true" /><ArrowLeft size={17} aria-hidden="true" />
        </Button>
      </div>
    </div>
    <div className={styles.titleRow}><h2>{defect.title}</h2></div>
    {retest && <DefectRetestPanel key={defect.id} retest={retest} />}
    <div className={`${tabs.row} ${styles.tabRow}`}>
      <Tabs aria-label={ru ? "Разделы баг-репорта" : "Bug report sections"} selectedKey={tab} disableAnimation={Boolean(reducedMotion)}
        classNames={{ base: tabs.base, tabList: tabs.tabs, tab: tabs.tab, tabContent: tabs.content, cursor: tabs.cursor }}
        motionProps={{ transition: { type: "spring", duration: reducedMotion ? 0 : .3, bounce: 0 } }}
        onSelectionChange={key => {
          if (key === "overview" || key === "attachments") transitionContent(() => onTabChange(key));
        }}>
        <Tab key="overview" id={`${tabsId}-overview`} aria-controls={`${tabsId}-panel`} title={ru ? "Общее" : "General"} />
        <Tab key="attachments" id={`${tabsId}-attachments`} aria-controls={`${tabsId}-panel`} title={<>
          {t("reports.attachments")}{evidenceCount > 0 && <span className={tabs.badge}>{evidenceCount}</span>}
        </>} />
      </Tabs>
      <div className={tabs.actions}><DefectReportDates key={defect.id} createdAt={defect.createdAt} archivedAt={defect.archivedAt} /></div>
    </div>
  </header>;
}
