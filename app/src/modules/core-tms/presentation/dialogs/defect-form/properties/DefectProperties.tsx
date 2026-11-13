import { Box, CircleDot, Flame, Minus, OctagonAlert, Plug, Repeat2 } from "lucide-react";
import { PropertyIdentityField } from "../../../common/properties/metadata/identity/PropertyIdentityField";
import { PriorityIcon, priorityLevels } from "../../../common/properties/PriorityIcon";
import { PropertySelect } from "../../../common/properties/select/PropertySelect";
import { PropertyRail } from "../../../common/properties/rail/PropertyRail";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { getDefectDialogCopy } from "../../defect/copy";
import type { DefectDraft, DefectRouting, DefectTraceabilityChoices } from "../model";
import { DefectRoutingHelp } from "../help/DefectRoutingHelp";
import { DefectFolderField } from "../placement/DefectFolderField";
import css from "./properties.module.css";

type Props = {
  workspaceId: string; offline: boolean; disabled: boolean; traceability?: DefectTraceabilityChoices;
  value: DefectDraft; onChange: (patch: Partial<DefectDraft>) => void;
  components: { value: string; label: string }[]; routing: DefectRouting; showRoutingError: boolean;
};
const severityIcons = { critical: OctagonAlert, high: Flame, medium: CircleDot, low: Minus };

export function DefectProperties({ workspaceId, offline, disabled, value, onChange, components, routing, showRoutingError, traceability }: Props) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const copy = getDefectDialogCopy(locale);
  const severityLevels = ["critical", "high", "medium", "low"] as const;
  return <PropertyRail label={ru ? "Свойства дефекта" : "Defect properties"} title={ru ? "Свойства" : "Properties"}>
      {traceability && !traceability.locked && <DefectFolderField value={value.sourceFolderId}
        choices={traceability} ru={ru} disabled={disabled} onChange={sourceFolderId => onChange({ sourceFolderId })} />}
      <PropertySelect locale={locale} label={copy.component} searchLabel={ru ? "Найти компонент…" : "Find a component…"}
        value={value.component} options={components.map(component => ({ ...component, icon: <Box size={15} aria-hidden="true" /> }))}
        onChange={component => onChange({ component })} disabled={disabled} />
      <PropertySelect locale={locale} label={copy.severity} searchLabel={ru ? "Изменить серьёзность…" : "Change severity…"}
        value={value.severity} onChange={severity => onChange({ severity })} disabled={disabled}
        options={severityLevels.map((level, index) => {
          const Icon = severityIcons[level];
          return { value: level, label: copy[level], shortcut: String(index + 1),
            icon: <span className={css.severityIcon} data-level={level}><Icon size={15} aria-hidden="true" /></span> };
        })} />
      <PropertySelect locale={locale} label={ru ? "Приоритет" : "Priority"}
        searchLabel={ru ? "Изменить приоритет…" : "Change priority…"} value={value.priority}
        onChange={priority => onChange({ priority })} disabled={disabled}
        options={priorityLevels.filter(level => level.key !== "none").map((level, index) => ({
          value: level.key, label: level[locale], shortcut: String(index + 1), icon: <PriorityIcon level={level.key} />,
        }))} />
      <PropertySelect locale={locale} label={copy.reproducibility} searchLabel={ru ? "Найти частоту…" : "Find a frequency…"}
        value={value.reproducibility} onChange={reproducibility => onChange({ reproducibility })} disabled={disabled}
        options={[{ value: "Always", label: copy.always }, { value: "Sometimes", label: copy.sometimes }, { value: "Once", label: copy.once }]
          .map(option => ({ ...option, icon: <Repeat2 size={15} aria-hidden="true" /> }))} />
      <PropertyIdentityField workspaceId={workspaceId} locale={locale} value={value.assigneeIdentityId} offline={offline}
        disabled={disabled} onChange={assigneeIdentityId => onChange({ assigneeIdentityId })} />
      <div className={css.routing}>
        <PropertySelect locale={locale} label={copy.routingLabel} searchLabel={ru ? "Найти интеграцию…" : "Find an integration…"}
          value={routing.value} options={routing.options.map(option => ({ ...option, icon: <Plug size={15} aria-hidden="true" /> }))}
          onChange={next => routing.onChange(next as DefectRouting["value"])} disabled={disabled || routing.disabled} />
        <DefectRoutingHelp />
      </div>
      {showRoutingError && !routing.resolved && <small className={css.error} role="alert">{routing.message}</small>}
  </PropertyRail>;
}
