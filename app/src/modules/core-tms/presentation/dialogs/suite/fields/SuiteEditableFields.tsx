import { Check, ChevronDown, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Suite } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { MarkdownField } from "../../../cases/inspector/markdown/MarkdownField";
import { getSuiteDialogCopy } from "../copy";
import css from "../suite-dialog.module.css";

type Section = "name" | "description" | "mode";
type Props = {
  retainedFilter?: Suite["filter"]; folders: readonly RepositoryFolder[]; name: string; description: string; type: Suite["type"]; tags: string; creating: boolean; ru: boolean;
  onName: (value: string) => void; onDescription: (value: string) => void;
  onType: (value: Suite["type"], restoring?: boolean) => void; onTags: (value: string) => void;
};
export function SuiteEditableFields(props: Props) {
  const copy = getSuiteDialogCopy(props.ru ? "ru" : "en");
  const [editing, setEditing] = useState<Section | null>(props.creating ? "name" : null);
  const original = useRef({ name: props.name, description: props.description, type: props.type, tags: props.tags });
  const edit = (section: Section) => {
    original.current = { name: props.name, description: props.description, type: props.type, tags: props.tags };
    setEditing(section);
  };
  const finish = (cancel: boolean) => {
    if (cancel) {
      if (editing === "name") props.onName(original.current.name);
      if (editing === "description") props.onDescription(original.current.description);
      if (editing === "mode") { props.onType(original.current.type, true); props.onTags(original.current.tags); }
    }
    setEditing(null);
  };
  const rule = props.retainedFilter;
  const retained = [rule?.folderId ? props.folders.find(folder => folder.id === rule.folderId)?.path ?? (props.ru ? "Сохранённая папка" : "Saved folder") : rule?.folderPathPrefix,
    rule?.priority?.length ? `${props.ru ? "Приоритеты" : "Priorities"}: ${rule.priority.join(", ")}` : null,
    rule?.lifecycle?.length ? `${props.ru ? "Статусы" : "Statuses"}: ${rule.lifecycle.join(", ")}` : null,
    rule?.text ? `${props.ru ? "Текст" : "Text"}: ${rule.text}` : null].filter(Boolean);
  const actions = <div className={css.editorActions}>
    <button type="button" onClick={() => finish(true)} aria-label={props.ru ? "Отменить изменение поля" : "Discard field changes"}><X size={14} /></button>
    <button type="button" onClick={() => finish(false)} aria-label={props.ru ? "Готово" : "Done"}><Check size={14} /></button>
  </div>;
  return <>
    <header className={css.hero}>
      {editing === "name" ? <div className={css.titleEditor}>
        <input data-inline-title required maxLength={200} autoFocus value={props.name} onChange={e => props.onName(e.target.value)} aria-label={copy.name}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); finish(false); } if (e.key === "Escape") { e.stopPropagation(); finish(true); } }} />{actions}
      </div> : <h1 className={css.titleLine}><button type="button" onClick={() => edit("name")} aria-label={`${props.ru ? "Изменить" : "Edit"}: ${copy.name}`}>{props.name.trim() || copy.name}</button></h1>}
    </header>
    <section className={css.editorialSection}>
      <div className={css.sectionTitle}><h2><button type="button" onClick={() => edit("description")}>{copy.description}</button></h2></div>
      <MarkdownField appearance="plain" label={copy.description} value={props.description} allowAttachments={false} compact autoFocus={editing === "description"}
        onRequestEdit={() => edit("description")} onChange={editing === "description" ? props.onDescription : undefined}
        emptyLabel={props.ru ? "Добавить описание" : "Add a description"} />
      {editing === "description" && actions}
    </section>
    <section className={css.editorialSection}>
      <div className={css.sectionTitle}><h2><button type="button" onClick={() => edit("mode")}>{copy.mode}</button></h2></div>
      {editing === "mode" ? <div className={css.modeEditor}>
        <div className={css.modeGroup} role="group" aria-label={copy.mode}>
          <button type="button" className={css.modeButton} aria-pressed={props.type === "static"} onClick={() => props.onType("static")}><strong>{copy.staticMode}</strong><span>{copy.staticModeHint}</span></button>
          <button type="button" className={css.modeButton} aria-pressed={props.type === "dynamic"} onClick={() => props.onType("dynamic")}><strong>{copy.dynamicMode}</strong><span>{copy.dynamicModeHint}</span></button>
        </div>
        {props.type === "dynamic" && <label className={css.tagsField}><span>{copy.tags}</span><input required value={props.tags} onChange={e => props.onTags(e.target.value)} placeholder={copy.tagsPlaceholder} /></label>}
        {actions}
      </div> : <button type="button" className={css.modeSummary} onClick={() => edit("mode")} aria-label={`${copy.mode}: ${props.type === "dynamic" ? copy.dynamicMode : copy.staticMode}`}>
        <span>{props.type === "dynamic" ? copy.dynamicMode : copy.staticMode}</span><ChevronDown size={14} />
        {props.type === "dynamic" && props.tags && <small>{props.tags}</small>}
      </button>}
      {retained.length > 0 && <p className={css.hint}>{props.ru ? "Сохранённые условия" : "Saved criteria"}: {retained.join(" · ")}</p>}
    </section>
  </>;
}
