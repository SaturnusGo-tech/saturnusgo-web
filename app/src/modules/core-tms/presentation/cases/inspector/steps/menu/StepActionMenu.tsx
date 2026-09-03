"use client";

import {
  ClipboardCheck, Copy, MoreHorizontal, Plus, Repeat2, Trash2,
} from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { SharedStepSummary } from "../../../../../shared-steps/model/shared-step";
import css from "./stepActionMenu.module.css";

type Props = {
  ru: boolean;
  sharedSteps: readonly SharedStepSummary[];
  canRemove?: boolean;
  trigger?: "icon" | "add";
  allowSharedSteps?: boolean;
  onAdd: (withExpectedResult: boolean) => void;
  onInsertShared: (id: string) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
};

export function StepActionMenu({
  ru, sharedSteps, canRemove = false, trigger = "icon", allowSharedSteps = true, onAdd,
  onInsertShared, onDuplicate, onRemove,
}: Props) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">(trigger === "add" ? "top" : "bottom");
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = root.current?.getBoundingClientRect();
      const popup = menu.current;
      if (!anchor || !popup) return;
      const popupHeight = Math.min(popup.scrollHeight, window.innerHeight * .7);
      const spaceAbove = anchor.top - 10;
      const spaceBelow = window.innerHeight - anchor.bottom - 10;
      const preferred = trigger === "add" ? "top" : "bottom";
      if (preferred === "top") setPlacement(spaceAbove >= popupHeight || spaceAbove >= spaceBelow ? "top" : "bottom");
      else setPlacement(spaceBelow >= popupHeight || spaceBelow >= spaceAbove ? "bottom" : "top");
    };
    place();
    window.addEventListener("resize", place);
    document.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", place, true);
    };
  }, [open, trigger]);
  const act = (action: () => void) => { action(); setOpen(false); };
  return <div className={css.root} ref={root}>
    <button type="button" className={trigger === "add" ? css.addTrigger : css.iconTrigger}
      aria-label={trigger === "add" ? (ru ? "Добавить в сценарий" : "Add to scenario")
        : (ru ? "Действия шага" : "Step actions")}
      aria-haspopup="menu" aria-expanded={open} aria-controls={menuId}
      onClick={() => setOpen((value) => !value)}>
      {trigger === "add" ? <><Plus size={15} />{ru ? "Добавить шаг" : "Add step"}</>
        : <MoreHorizontal size={16} />}
    </button>
    <div id={menuId} ref={menu} className={css.menu} role="menu" data-open={open}
      data-trigger={trigger} data-placement={placement} aria-hidden={!open}>
      {(onDuplicate || onRemove) && <>
        {onDuplicate && <MenuButton icon={<Copy size={15} />} label={ru ? "Дублировать" : "Duplicate"}
          onClick={() => act(onDuplicate)} />}
        {onRemove && <MenuButton danger disabled={!canRemove} icon={<Trash2 size={15} />}
          label={ru ? "Удалить" : "Delete"} onClick={() => act(onRemove)} />}
        <div className={css.separator} />
      </>}
      <span className={css.groupLabel}>{ru ? "Добавить новый" : "Add new"}</span>
      <MenuButton icon={<Plus size={15} />} label={ru ? "Шаг" : "Step"}
        onClick={() => act(() => onAdd(false))} />
      <MenuButton icon={<ClipboardCheck size={15} />}
        label={ru ? "Шаг с ожидаемым результатом" : "Step with expected result"}
        onClick={() => act(() => onAdd(true))} />
      {allowSharedSteps && <>
        <div className={css.separator} />
        <span className={css.groupLabel}>{ru ? "Общий шаг" : "Shared step"}</span>
        {sharedSteps.length ? <div className={css.sharedList}>{sharedSteps.map((item) =>
          <MenuButton key={item.id} icon={<Repeat2 size={15} />} label={item.title}
            onClick={() => act(() => onInsertShared(item.id))} />)}</div>
          : <span className={css.empty}>{ru ? "Общие шаги ещё не созданы" : "No shared steps yet"}</span>}
      </>}
    </div>
  </div>;
}

function MenuButton({ icon, label, onClick, disabled, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return <button type="button" role="menuitem" disabled={disabled} data-danger={danger || undefined}
    onClick={onClick}>{icon}<span>{label}</span></button>;
}
