import type { ReactNode } from "react";
import { PiCaretDown, PiCaretRight, PiCheck } from "react-icons/pi";
import css from "../parent-folder-picker.module.css";

export function FolderChoiceRow({ name, secondary, icon, depth, selected, tabIndex, disabled, expanded, onToggle, onChoose }: {
  name: string;
  secondary?: ReactNode;
  icon: ReactNode;
  depth: number;
  selected: boolean;
  tabIndex: number;
  disabled?: boolean;
  expanded?: boolean;
  onToggle?(): void;
  onChoose(): void;
}) {
  return <div className={css.row} style={{ paddingInlineStart: Math.min(depth, 10) * 18 }}>
    {onToggle ? <button type="button" className={css.disclosure} tabIndex={-1} aria-label={name}
      aria-expanded={expanded} disabled={disabled} onClick={onToggle}>
      {expanded ? <PiCaretDown size={12} /> : <PiCaretRight size={12} />}
    </button> : <span className={css.disclosure} aria-hidden="true" />}
    <button type="button" role="option" aria-selected={selected} tabIndex={tabIndex} disabled={disabled} onClick={onChoose} title={name}>
      <span className={css.visual} aria-hidden="true">{icon}</span>
      <span className={css.label}><span className={css.name}>{name}</span>{secondary && <small>{secondary}</small>}</span>
      {selected && <PiCheck size={15} className={css.check} aria-hidden="true" />}
    </button>
  </div>;
}
