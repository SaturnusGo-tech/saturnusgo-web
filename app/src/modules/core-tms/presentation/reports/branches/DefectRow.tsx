import { Button } from "@heroui/react";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../../localization/format/labels";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { PriorityIcon, priorityLabel } from "../../common/properties/PriorityIcon";
import { DefectStatusIcon } from "../../common/properties/defect/DefectStatusIcon";
import { FalconTooltip } from "../../common/tooltip/FalconTooltip";
import styles from "./defect-branch.module.css";

export function DefectRow({ defect, selected, onSelect }: {
  defect: Defect; workspaceId?: string; selected: boolean; onSelect: (id: string) => void;
}) {
  const { locale } = useTmsLocale();
  const priority = priorityLabel(locale, defect.priority);
  const status = localizedLabel(locale, defect.status);
  return <li className={styles.leaf}>
    <Button type="button" size="sm" variant="light" disableRipple className={styles.row} data-defect-row data-selected={selected || undefined}
      onPress={() => onSelect(defect.id)} aria-current={selected ? "page" : undefined}>
      <span className={styles.priority} role="img" aria-label={priority} title={priority}>
        <PriorityIcon level={defect.priority} empty="circle" size={14} />
      </span>
      <strong className={styles.title} title={defect.title}>{defect.title}</strong>
      <FalconTooltip label={status}>
        <span className={styles.status} role="img" aria-label={status}>
          <DefectStatusIcon status={defect.status} />
        </span>
      </FalconTooltip>
    </Button>
  </li>;
}
