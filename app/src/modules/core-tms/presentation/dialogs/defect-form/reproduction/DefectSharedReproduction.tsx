import { Button } from "@heroui/react";
import { ArrowDown, ArrowUp, Plus, Repeat2, X } from "lucide-react";
import { useState } from "react";
import { PropertyPopover } from "../../../common/properties/select/PropertySelect";
import { SharedStepChooser } from "../../../shared-steps/selection/SharedStepChooser";
import type { DefectDraft, DefectTraceabilityChoices } from "../model";
import css from "./reproduction.module.css";

type Reference = NonNullable<DefectDraft["reproductionSharedSteps"]>[number];
export function DefectSharedReproduction({ value, choices, onChange, ru, disabled }: {
  value: readonly Reference[]; choices: DefectTraceabilityChoices; onChange(value: readonly Reference[]): void; ru: boolean; disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = ru ? "Шаги воспроизведения" : "Steps to reproduce";
  const available = choices.sharedSteps.filter(item => !item.archivedAt);
  const move = (index: number, offset: number) => {
    const next = [...value]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; onChange(next);
  };
  return <section className={css.section} aria-label={label}>
    <h3>{label}</h3>
    <p className={css.hint}>{ru ? "Выберите общие сценарии в порядке воспроизведения." : "Choose shared scenarios in reproduction order."}</p>
    {value.length > 0 && <ol className={css.list}>{value.map((reference, index) => {
      const item = available.find(entry => entry.id === reference.sharedStepId && entry.currentRevision === reference.revision);
      const title = item?.title ?? (ru ? "Выбранный общий сценарий" : "Selected shared scenario");
      return <li key={`${index}:${reference.sharedStepId}`} className={css.row}>
        <Repeat2 size={14} aria-hidden="true" /><span className={css.title}>{title}<small>{ru ? "Версия" : "Revision"} {reference.revision}</small></span>
        <Button isIconOnly variant="light" className={css.action} isDisabled={disabled || index === 0}
          aria-label={ru ? `Переместить выше: ${title}` : `Move up: ${title}`} onPress={() => move(index, -1)}><ArrowUp size={14} /></Button>
        <Button isIconOnly variant="light" className={css.action} isDisabled={disabled || index === value.length - 1}
          aria-label={ru ? `Переместить ниже: ${title}` : `Move down: ${title}`} onPress={() => move(index, 1)}><ArrowDown size={14} /></Button>
        <Button isIconOnly variant="light" className={css.action} isDisabled={disabled}
          aria-label={ru ? `Убрать: ${title}` : `Remove: ${title}`} onPress={() => onChange(value.filter((_, at) => at !== index))}><X size={14} /></Button>
      </li>;
    })}</ol>}
    <PropertyPopover label={label} triggerLabel={ru ? "Добавить общий сценарий" : "Add shared scenario"} open={open}
      onOpenChange={setOpen} disabled={disabled || choices.loading || Boolean(choices.error) || value.length >= 20}
      trigger={<><Plus size={14} />{ru ? "Добавить общий сценарий" : "Add shared scenario"}</>}>
      <SharedStepChooser items={available} ru={ru} onSelect={id => {
        if (disabled || choices.loading || choices.error || value.length >= 20) return;
        const item = available.find(entry => entry.id === id); if (!item) return;
        onChange([...value, { sharedStepId: item.id, revision: item.currentRevision }]); setOpen(false);
      }} />
    </PropertyPopover>
  </section>;
}
