import { Button } from "@heroui/react";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../../localization/format/labels";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import { PriorityIcon, priorityLabel } from "../../common/properties/PriorityIcon";
import { DefectStatusIcon } from "../../common/properties/defect/DefectStatusIcon";
import styles from "./defect-branch.module.css";

export function DefectRow({ defect, workspaceId, selected, onSelect }: {
  defect: Defect; workspaceId?: string; selected: boolean; onSelect: (id: string) => void;
}) {
  const { locale, t } = useTmsLocale();
  const priority = priorityLabel(locale, defect.priority);
  const status = localizedLabel(locale, defect.status);
  return <li className={styles.leaf}>
    <Button type="button" size="sm" variant="light" className={styles.row} data-defect-row data-selected={selected || undefined}
      onPress={() => onSelect(defect.id)} aria-current={selected ? "page" : undefined}
      title={`${defect.key} · ${defect.title}`}>
      <span className={styles.priority} role="img" aria-label={priority} title={priority}>
        <PriorityIcon level={defect.priority} empty="circle" size={14} />
      </span>
      <span className={styles.status} title={status}>
        <DefectStatusIcon status={defect.status} /><span>{status}</span>
      </span>
      <strong className={styles.title} title={defect.title}>{defect.title}</strong>
      <span className={styles.key} title={defect.key}>{defect.key}</span>
      <span className={styles.assignee}>{workspaceId
        ? <ResponsibleName workspaceId={workspaceId} identityId={defect.assigneeIdentityId} />
        : t("common.unassigned")}</span>
    </Button>
  </li>;
}
