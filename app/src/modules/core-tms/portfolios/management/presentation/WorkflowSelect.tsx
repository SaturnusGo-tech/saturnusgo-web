import { Circle, CircleDashed, CircleEllipsis, CirclePause, CircleSlash2, CircleX } from "lucide-react";
import { PiCheckCircleFill, PiCircleHalfFill } from "react-icons/pi";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { PropertySelect } from "../../../presentation/common/properties/select/PropertySelect";
import { organizationCopy } from "../model/copy";
import { workflowPhases, type WorkflowPhase } from "../model/organization";
import css from "./management.module.css";

const phaseIcons = {
  backlog: CircleDashed, todo: Circle, in_progress: PiCircleHalfFill, done: PiCheckCircleFill,
  canceled: CircleX, duplicate: CircleSlash2, new: CircleDashed, in_review: CircleEllipsis, on_hold: CirclePause,
} satisfies Record<WorkflowPhase, typeof Circle | typeof PiCircleHalfFill>;

export function WorkflowSelect({ value, disabled, onChange }: {
  value: WorkflowPhase; disabled?: boolean; onChange: (value: WorkflowPhase) => void;
}) {
  const { locale } = useTmsLocale();
  const copy = organizationCopy(locale);
  return <PropertySelect locale={locale} label={copy.phase} searchLabel={copy.changePhase} value={value}
    disabled={disabled} onChange={onChange} menuClassName={css.phaseMenu} options={workflowPhases.map((phase, index) => {
      const Icon = phaseIcons[phase];
      return { value: phase, label: copy.phases[phase], shortcut: String(index + 1),
        icon: <span className={css.phaseIcon} data-phase={phase} aria-hidden="true"><Icon size={15} /></span> };
    })} />;
}
