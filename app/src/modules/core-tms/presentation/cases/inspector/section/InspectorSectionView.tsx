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
  headingActions?: React.ReactNode;
  actionsInHeader?: boolean;
  hideHeading?: boolean;
  disabled?: boolean;
  hideEdit?: boolean;
  onEdit: (section: InspectorSection) => void;
  onCancel: (section: InspectorSection) => void;
  onSave: (section: InspectorSection) => void;
  children: React.ReactNode;
};

export function InspectorSectionView(props: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const active = props.editing;
  function restoreFocus() {
    requestAnimationFrame(() => {
      (editButton.current ?? sectionRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)"))?.focus({ preventScroll: true });
    });
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
  const cancelLabel = props.ru ? "Отмена" : "Cancel";
  const applyLabel = props.ru ? "Применить" : "Apply";
  const actions = active && !props.persistentEditing && (
    <div className={props.actionsInHeader ? css.sectionHeaderActions : css.sectionActions}>
      <button type="button" disabled={props.disabled} onClick={cancel} aria-label={cancelLabel} title={cancelLabel}>
        <X size={props.actionsInHeader ? 12 : 13} aria-hidden />{!props.actionsInHeader && cancelLabel}
      </button>
      <button type="button" className={css.saveButton} disabled={props.disabled} onClick={save} aria-label={applyLabel} title={applyLabel}>
        <Check size={props.actionsInHeader ? 12 : 13} aria-hidden />{!props.actionsInHeader && applyLabel}
      </button>
    </div>
  );
  return <section ref={sectionRef}
    aria-label={props.hideHeading ? props.title : undefined}
    data-rail-details={props.hideHeading || undefined}
    className={`${css.section} ${props.section === "description" || props.section === "preconditions" ? css.narrativeSection : ""}`}
    data-field-editing={props.actionsInHeader && active ? "" : undefined}
    onKeyDown={(event) => {
      if (!active || props.persistentEditing || event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }}
  >
    {(!props.hideHeading || actions) && <header>
      {!props.hideHeading && <h3>{props.title}</h3>}
      {props.count !== undefined && <span className={css.count}>{props.count}</span>}
      {props.headingActions}
      {!props.hideEdit && !props.persistentEditing && !active && <button
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
      {props.actionsInHeader && actions}
    </header>}
    <div className={css.sectionBody}>{props.children}</div>
    {!props.actionsInHeader && actions}
  </section>;
}
