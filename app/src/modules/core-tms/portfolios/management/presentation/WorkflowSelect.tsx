import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AnimatedSelect } from "../../../presentation/common/select/AnimatedSelect";
import { organizationCopy } from "../model/copy";
import { workflowPhases, type WorkflowPhase } from "../model/organization";
import css from "./management.module.css";
export function WorkflowSelect({ value, disabled, onChange }: { value: WorkflowPhase; disabled?: boolean; onChange: (value: WorkflowPhase) => void }) {
  const { locale } = useTmsLocale();
  const copy = organizationCopy(locale);
  return <AnimatedSelect compact className={css.phase} label={copy.phase} value={value} disabled={disabled}
    options={workflowPhases.map((phase) => ({ value: phase, label: copy.phases[phase] }))}
    onChange={(value) => { if (workflowPhases.includes(value as WorkflowPhase)) onChange(value as WorkflowPhase); }} />;
}
