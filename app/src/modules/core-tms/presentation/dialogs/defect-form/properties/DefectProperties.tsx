import { Input } from "@heroui/react";
import { CircleDot, Flame, Minus, OctagonAlert } from "lucide-react";
import { useId } from "react";
import { PropertyIdentityField } from "../../../common/properties/metadata/identity/PropertyIdentityField";
import { PriorityIcon, priorityLevels } from "../../../common/properties/PriorityIcon";
import { PropertySelect } from "../../../common/properties/select/PropertySelect";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { getDefectDialogCopy } from "../../defect/copy";
import type { DefectDraft, DefectRouting } from "../model";
import { DefectRoutingHelp } from "../help/DefectRoutingHelp";
import form from "../form.module.css";
import css from "./properties.module.css";

type Props = {
  workspaceId: string; offline: boolean; disabled: boolean;
  value: DefectDraft; onChange: (patch: Partial<DefectDraft>) => void;
  components: { value: string; label: string }[]; routing: DefectRouting; showRoutingError: boolean;
};
const severityIcons = { critical: OctagonAlert, high: Flame, medium: CircleDot, low: Minus };

export function DefectProperties({ workspaceId, offline, disabled, value, onChange, components, routing, showRoutingError }: Props) {
  const linkId = useId();
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const copy = getDefectDialogCopy(locale);
  const severityLevels = ["critical", "high", "medium", "low"] as const;
  return <aside className={css.properties} aria-label={ru ? "Свойства дефекта" : "Defect properties"}>
    <div className={css.row}><span>{copy.component}</span>
      <PropertySelect locale={locale} label={copy.component} searchLabel={ru ? "Найти компонент…" : "Find a component…"}
        value={value.component} options={components} onChange={component => onChange({ component })} disabled={disabled} />
    </div>
    <div className={css.row}><span>{copy.severity}</span>
      <PropertySelect locale={locale} label={copy.severity} searchLabel={ru ? "Изменить серьёзность…" : "Change severity…"}
        value={value.severity} onChange={severity => onChange({ severity })} disabled={disabled}
        options={severityLevels.map((level, index) => {
          const Icon = severityIcons[level];
          return { value: level, label: copy[level], shortcut: String(index + 1),
            icon: <span className={css.severityIcon} data-level={level}><Icon size={15} aria-hidden="true" /></span> };
        })} />
    </div>
    <div className={css.row}><span>{ru ? "Приоритет" : "Priority"}</span>
      <PropertySelect locale={locale} label={ru ? "Приоритет" : "Priority"}
        searchLabel={ru ? "Изменить приоритет…" : "Change priority…"} value={value.priority}
        onChange={priority => onChange({ priority })} disabled={disabled}
        options={priorityLevels.filter(level => level.key !== "none").map((level, index) => ({
          value: level.key, label: level[locale], shortcut: String(index + 1), icon: <PriorityIcon level={level.key} />,
        }))} />
    </div>
    <div className={css.row}><span>{copy.reproducibility}</span>
      <PropertySelect locale={locale} label={copy.reproducibility} searchLabel={ru ? "Найти частоту…" : "Find a frequency…"}
        value={value.reproducibility} onChange={reproducibility => onChange({ reproducibility })} disabled={disabled}
        options={[{ value: "Always", label: copy.always }, { value: "Sometimes", label: copy.sometimes }, { value: "Once", label: copy.once }]} />
    </div>
    <div className={css.row}><span>{ru ? "Ответственный" : "Assignee"}</span>
      <PropertyIdentityField workspaceId={workspaceId} locale={locale} value={value.assigneeIdentityId} offline={offline}
        disabled={disabled} onChange={assigneeIdentityId => onChange({ assigneeIdentityId })} />
    </div>
    <div className={css.row}><span className={css.label}>{copy.routingLabel}<DefectRoutingHelp /></span>
      <PropertySelect locale={locale} label={copy.routingLabel} searchLabel={ru ? "Найти интеграцию…" : "Find an integration…"}
        value={routing.value} options={routing.options} onChange={next => routing.onChange(next as DefectRouting["value"])}
        disabled={disabled || routing.disabled} />
      {showRoutingError && !routing.resolved && <small className={css.error} role="alert">{routing.message}</small>}
    </div>
    <div className={css.row}><label htmlFor={linkId}>{copy.deepLink}</label>
      <Input id={linkId} type="text" aria-label={copy.deepLink} size="sm" value={value.link}
        classNames={{ inputWrapper: form.fieldShell, input: form.fieldInput }}
        placeholder={copy.linkPlaceholder} isDisabled={disabled} onValueChange={link => onChange({ link })} />
    </div>
  </aside>;
}
