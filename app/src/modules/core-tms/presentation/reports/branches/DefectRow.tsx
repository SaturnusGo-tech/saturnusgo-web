import { CheckCircle2, CircleDashed } from "lucide-react";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../../localization/format/labels";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import { PrioritySignal } from "../../cases/list/priority/PrioritySignal";
import surface from "../reports.module.css";
import styles from "./defect-branch.module.css";

export function DefectRow({ defect, workspaceId, selected, onSelect }: {
  defect: Defect; workspaceId?: string; selected: boolean; onSelect: (id: string) => void;
}) {
  const { locale, t } = useTmsLocale();
  return <li className={styles.leaf}>
    <button type="button" className={styles.row} data-selected={selected || undefined}
      onClick={() => onSelect(defect.id)} aria-current={selected ? "page" : undefined}
      title={`${defect.key} · ${defect.title}`}>
      <span className={styles.severity}><PrioritySignal priority={defect.severity}
        label={localizedLabel(locale, defect.severity)} size={14} /></span>
      <span className={styles.summary}><span className={styles.title}>{defect.title}</span>
        <span className={styles.caption}>{defect.key}</span></span>
      <span className={`${surface.statusChip} ${styles.status}`} data-status={defect.status}>
        {defect.status === "open" ? <CircleDashed size={13} aria-hidden="true" />
          : ["verified", "closed"].includes(defect.status) ? <CheckCircle2 size={13} aria-hidden="true" /> : null}
        {localizedLabel(locale, defect.status)}
      </span>
      <span className={styles.assignee}>{workspaceId
        ? <ResponsibleName workspaceId={workspaceId} identityId={defect.assigneeIdentityId} />
        : t("common.unassigned")}</span>
    </button>
  </li>;
}
