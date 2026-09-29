import { RunDetailsPopover } from "../repository/details/RunDetailsPopover";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import { useWorkspacePeople } from "../../../workspace/members/context/WorkspacePeopleContext";
import { ChevronDown, Play } from "lucide-react";
import type { RunItem, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { statusIcon } from "../../status/executionStatus";
import styles from "../../../tms.module.css";
import runStyles from "../runs.module.css";

type Props = {
  propertiesOpen?: boolean; propertiesId?: string; onToggleProperties?: () => void;
  run: TestRunSummary;
  item: RunItem;
  archivePending: boolean;
  itemIndex: number;
  itemCount: number;
  canStart: boolean; startPending: boolean; onStart: () => void;
};

export function RunExecutionHeader({ propertiesOpen, propertiesId, onToggleProperties, run, item, archivePending, itemIndex, itemCount, canStart, startPending, onStart }: Props) {
  const { workspaceId, offline } = useWorkspacePeople();
  const { locale } = useTmsLocale();

  return (
    <header className={runStyles.header}>
      <div className={runStyles.utilityRow}>
        <div className={runStyles.runContext}>
          <span>{locale === "ru" ? `Кейс ${itemIndex + 1} из ${itemCount}` : `Case ${itemIndex + 1} of ${itemCount}`}</span>
        </div>
        {canStart && <div className={runStyles.headerActions}>
          <button type="button" className={styles.primaryButton} disabled={startPending || archivePending} onClick={onStart} data-testid="start-existing-run"><Play size={16} />{startPending ? (locale === "ru" ? "Запускаем…" : "Starting…") : (locale === "ru" ? "Начать прогон" : "Start run")}</button>
        </div>}
      </div>
      <div className={runStyles.titleBlock}>
        <h1>{item.snapshot.title}<span>#{item.caseKey}</span></h1>
        <div className={runStyles.headerByline}>
          <span className={`${runStyles.executionBadge} ${runStyles[`execution_${item.status}`]}`}>{statusIcon[item.status]}{localizedLabel(locale, item.status)}</span>
          <span>{locale === "ru" ? "Исполнитель кейса:" : "Case assignee:"}</span>
          <ResponsibleName workspaceId={workspaceId} identityId={item.assigneeIdentityId} offline={offline} />
          <RunDetailsPopover key={run.id} run={run} ru={locale === "ru"} />
          {onToggleProperties && <button type="button" className={runStyles.propertiesToggle} aria-expanded={propertiesOpen} aria-controls={propertiesId} onClick={onToggleProperties}>
            {locale === "ru" ? "Свойства" : "Properties"}<ChevronDown size={14} aria-hidden="true" />
          </button>}
        </div>
      </div>
    </header>
  );
}
