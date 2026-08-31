import { Check, Pencil, X } from "lucide-react";
import { useRef } from "react";
import type { InspectorSection } from "../model";
import css from "../caseInspector.module.css";

type Props = {
  title: string;
  editLabel?: string;
  section: InspectorSection;
  editing: boolean;
  persistentEditing?: boolean;
  ru: boolean;
  count?: number;
  disabled?: boolean;
  onEdit: (section: InspectorSection) => void;
  onCancel: (section: InspectorSection) => void;
  onSave: (section: InspectorSection) => void;
  children: React.ReactNode;
};

export function InspectorSectionView(props: Props) {
  const editButton = useRef<HTMLButtonElement>(null);
  const active = props.editing;
  function restoreFocus() {
    requestAnimationFrame(() => editButton.current?.focus());
  }
  function cancel() {
    if (props.disabled) return;
    props.onCancel(props.section);
    restoreFocus();
  }
  function save() {
    if (props.disabled) return;
    props.onSave(props.section);
    restoreFocus();
  }
  return <section
    className={css.section}
    onKeyDown={(event) => {
      if (!active || props.persistentEditing || event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }}
  >
    <header>
      <h3>{props.title}</h3>
      {props.count !== undefined && <span className={css.count}>{props.count}</span>}
      {!props.persistentEditing && !active && <button
        ref={editButton}
        type="button"
        className={css.iconButton}
        disabled={props.disabled}
        onClick={() => props.onEdit(props.section)}
        aria-label={props.editLabel ?? `${props.ru ? "Изменить" : "Edit"} ${props.title}`}
        title={props.editLabel ?? `${props.ru ? "Изменить" : "Edit"} ${props.title}`}
      >
        <Pencil size={14} />
      </button>}
    </header>
    <div className={css.sectionBody}>{props.children}</div>
    {active && !props.persistentEditing && <div className={css.sectionActions}>
      <button type="button" disabled={props.disabled} onClick={cancel}>
        <X size={13} />{props.ru ? "Отмена" : "Cancel"}
      </button>
      <button
        type="button"
        className={css.saveButton}
        disabled={props.disabled}
        onClick={save}
      >
        <Check size={13} />{props.ru ? "Применить" : "Apply"}
      </button>
    </div>}
  </section>;
}
