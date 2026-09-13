import { AnimatedSelect } from "../../../common/select/AnimatedSelect";
import { ResponsiblePicker } from "../../../../workspace/members/presentation/ResponsiblePicker";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { getDefectDialogCopy } from "../../defect/copy";
import type { DefectDraft, DefectRouting } from "../model";
import { DefectRoutingHelp } from "../help/DefectRoutingHelp";
import css from "./properties.module.css";

type Props = {
  workspaceId: string; offline: boolean; disabled: boolean;
  value: DefectDraft; onChange: (patch: Partial<DefectDraft>) => void;
  components: { value: string; label: string }[]; routing: DefectRouting; showRoutingError: boolean;
};
export function DefectProperties({ workspaceId, offline, disabled, value, onChange, components, routing, showRoutingError }: Props) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const copy = getDefectDialogCopy(locale);
  const levels = [{ value: "low", label: copy.low }, { value: "medium", label: copy.medium },
    { value: "high", label: copy.high }, { value: "critical", label: copy.critical }];
  return <aside className={css.properties} aria-label={ru ? "Свойства дефекта" : "Defect properties"}>
    <div className={css.row}><span>{copy.component}</span><AnimatedSelect className={css.value} label={copy.component}
      value={value.component} options={components} onChange={component => onChange({ component })} disabled={disabled} /></div>
    <div className={css.row}><span>{copy.severity}</span><AnimatedSelect className={css.value} label={copy.severity}
      value={value.severity} options={levels} onChange={severity => onChange({ severity: severity as DefectDraft["severity"] })} disabled={disabled} /></div>
    <div className={css.row}><span>{ru ? "Приоритет" : "Priority"}</span><AnimatedSelect className={css.value} label={ru ? "Приоритет" : "Priority"}
      value={value.priority} options={ru ? [
        { value: "low", label: "Низкий" }, { value: "medium", label: "Средний" },
        { value: "high", label: "Высокий" }, { value: "critical", label: "Критический" },
      ] : levels} onChange={priority => onChange({ priority: priority as DefectDraft["priority"] })} disabled={disabled} /></div>
    <div className={css.row}><span>{copy.reproducibility}</span><AnimatedSelect className={css.value} label={copy.reproducibility}
      value={value.reproducibility} onChange={reproducibility => onChange({ reproducibility })} disabled={disabled}
      options={[{ value: "Always", label: copy.always }, { value: "Sometimes", label: copy.sometimes }, { value: "Once", label: copy.once }]} /></div>
    <div className={css.row}><span>{ru ? "Ответственный" : "Assignee"}</span><div className={css.responsible}>
      <ResponsiblePicker workspaceId={workspaceId} value={value.assigneeIdentityId} offline={offline} disabled={disabled}
        onChange={assigneeIdentityId => onChange({ assigneeIdentityId })} /></div></div>
    <div className={css.row}><span className={css.label}>{copy.routingLabel}<DefectRoutingHelp /></span>
      <AnimatedSelect className={css.value} label={copy.routingLabel} value={routing.value} options={routing.options}
        onChange={value => routing.onChange(value as DefectRouting["value"])} disabled={disabled || routing.disabled} />
      {showRoutingError && !routing.resolved && <small className={css.error} role="alert">{routing.message}</small>}
    </div>
  </aside>;
}
