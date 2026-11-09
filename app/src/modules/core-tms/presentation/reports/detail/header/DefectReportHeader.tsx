import { Button, Tab, Tabs, Tooltip } from "@heroui/react";
import { ArrowLeft, Info, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import { buildDefectDeepLink } from "../../../../defects/navigation/defect-deep-link";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { DefectRetest } from "../../../../runs/verification/state/defect/useDefectRetest";
import { CommentShareItem } from "../../../cases/collaboration/sharing/CommentShareItem";
import overlays from "../../../cases/detail/header/case-header-overlays.module.css";
import tabs from "../../../cases/detail/tabs/case-detail-tabs.module.css";
import inspector from "../../../cases/inspector/caseInspector.module.css";
import { transitionContent } from "../../../workspace/motion/transition/content-transition";
import { DefectRetestAction } from "../retest/DefectRetestAction";
import { DefectRetestPanel } from "../retest/DefectRetestPanel";
import detail from "../defect-detail.module.css";

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
  const back = t("reports.backToList");
  return <header className={detail.header}>
    <div className={`${inspector.utilityRow} ${detail.utility}`}>
      <div className={inspector.headerActions}>
        {retest && <DefectRetestAction retest={retest} />}
        <div className={detail.share}>
          <CommentShareItem key={defect.id} compact resource="defect" ru={ru} link={() => {
            const url = new URL(window.location.href);
            if (workspaceId) url.searchParams.set("workspaceId", workspaceId);
            return buildDefectDeepLink(url.href, { projectId: defect.projectId, defectId: defect.id, includeArchived: Boolean(defect.archivedAt) });
          }} />
        </div>
        <Button type="button" isIconOnly variant="light" disableRipple aria-label={back} title={back}
          className={`${inspector.iconButton} ${detail.back}`} onPress={onBack}>
          <X size={17} aria-hidden="true" /><ArrowLeft size={17} aria-hidden="true" />
        </Button>
      </div>
    </div>
    <div className={inspector.titleRow}>
      <h2>{defect.title}<span className={inspector.titleKey}>#{defect.key}</span></h2>
    </div>
    {retest && <DefectRetestPanel key={defect.id} retest={retest} />}
    <div className={`${tabs.row} ${detail.tabRow}`}>
      <Tabs aria-label={ru ? "Разделы баг-репорта" : "Bug report sections"} selectedKey={tab}
        classNames={{ base: tabs.base, tabList: tabs.tabs, tab: tabs.tab, tabContent: tabs.content, cursor: tabs.cursor }}
        motionProps={{ transition: { type: "spring", duration: .3, bounce: 0 } }}
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

function DefectReportDates({ createdAt, archivedAt }: { createdAt: string; archivedAt?: string | null }) {
  const { locale, languageTag, t } = useTmsLocale();
  const [open, setOpen] = useState(false);
  const wasOpenBeforeTouch = useRef(false);
  const ru = locale === "ru";
  const format = new Intl.DateTimeFormat(languageTag, { dateStyle: "medium", timeStyle: "short" });
  return <Tooltip isOpen={open} onOpenChange={setOpen} placement="bottom-end" offset={5} delay={350} closeDelay={60}
    disableAnimation classNames={{ base: overlays.positioner, content: overlays.dates }}
    content={<dl>
      <div><dt>{t("reports.created")}</dt><dd><time dateTime={createdAt}>{format.format(new Date(createdAt))}</time></dd></div>
      {archivedAt && <div><dt>{ru ? "В архиве с" : "Archived on"}</dt>
        <dd><time dateTime={archivedAt}>{format.format(new Date(archivedAt))}</time></dd></div>}
    </dl>}>
    <Button type="button" isIconOnly variant="light" disableRipple className={overlays.dateTrigger}
      aria-label={ru ? "Даты баг-репорта" : "Bug report dates"}
      onPointerDownCapture={event => { if (event.pointerType === "touch") wasOpenBeforeTouch.current = open; }}
      onPress={event => { if (event.pointerType === "touch") setOpen(!wasOpenBeforeTouch.current); }}>
      <Info size={15} aria-hidden="true" />
    </Button>
  </Tooltip>;
}
