"use client";

import { Button, Listbox, ListboxItem, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { ArrowLeft, ClipboardCheck, Copy, MoreHorizontal, Plus, Repeat2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { SharedStepSummary } from "../../../../../shared-steps/model/shared-step";
import { SharedStepChooser } from "../../../../shared-steps/selection/SharedStepChooser";
import css from "./stepActionMenu.module.css";

type Props = {
  ru: boolean;
  sharedSteps: readonly SharedStepSummary[];
  canRemove?: boolean;
  trigger?: "icon" | "add" | "start";
  allowSharedSteps?: boolean;
  onAdd: (withExpectedResult: boolean) => void;
  onInsertShared: (id: string) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
};

export function StepActionMenu({ ru, sharedSteps, canRemove = false, trigger = "icon", allowSharedSteps = true,
  onAdd, onInsertShared, onDuplicate, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const setMenu = (value: boolean) => { setOpen(value); if (!value) setChoosing(false); };
  const action = (callback: () => void) => { callback(); setMenu(false); };
  const entries = [
    ...(onDuplicate ? [{ id: "duplicate", label: ru ? "Дублировать" : "Duplicate", icon: <Copy size={15} />, run: onDuplicate }] : []),
    ...(onRemove ? [{ id: "delete", label: ru ? "Удалить" : "Delete", icon: <Trash2 size={15} />, run: onRemove }] : []),
    { id: "step", label: ru ? "Шаг" : "Step", icon: <Plus size={15} />, run: () => onAdd(false) },
    { id: "expected", label: ru ? "Шаг с ожидаемым результатом" : "Step with expected result", icon: <ClipboardCheck size={15} />, run: () => onAdd(true) },
    ...(allowSharedSteps ? [{ id: "shared", label: ru ? "Выбрать общий шаг" : "Choose shared step", icon: <Repeat2 size={15} />, run: () => setChoosing(true) }] : []),
  ];
  const label = trigger === "start" ? (ru ? "Вставить в начало" : "Insert at beginning")
    : trigger === "add" ? (ru ? "Добавить шаг" : "Add step") : (ru ? "Действия шага" : "Step actions");
  return <Popover disableAnimation shouldBlockScroll={false} shouldCloseOnScroll={false} isOpen={open} onOpenChange={setMenu}
    placement={trigger === "add" ? "top-start" : "bottom-start"} offset={5}
    classNames={{ base: css.positioner, content: css.menu }}>
    <PopoverTrigger><Button type="button" variant="light" isIconOnly={trigger === "icon"}
      className={trigger === "icon" ? css.iconTrigger : css.addTrigger} aria-label={label}>
      {trigger === "icon" ? <MoreHorizontal size={16} /> : <><Plus size={15} />{label}</>}
    </Button></PopoverTrigger>
    <PopoverContent aria-label={label}>
      {choosing ? <>
        <Button variant="light" className={css.back} onPress={() => setChoosing(false)}>
          <ArrowLeft size={14} />{ru ? "Общие шаги" : "Shared steps"}
        </Button>
        <SharedStepChooser items={sharedSteps} ru={ru} onSelect={id => action(() => onInsertShared(id))} />
      </> : <Listbox aria-label={label} disabledKeys={canRemove ? [] : ["delete"]}
        classNames={{ base: css.list, list: css.options }} itemClasses={{ base: css.option, title: css.optionTitle }}
        onAction={key => { const entry = entries.find(item => item.id === key); if (entry) {
          if (entry.id === "shared") entry.run(); else action(entry.run);
        } }}>
        {entries.map(entry => <ListboxItem key={entry.id} textValue={entry.label} startContent={entry.icon}
          className={entry.id === "delete" ? css.danger : undefined}>{entry.label}</ListboxItem>)}
      </Listbox>}
    </PopoverContent>
  </Popover>;
}
