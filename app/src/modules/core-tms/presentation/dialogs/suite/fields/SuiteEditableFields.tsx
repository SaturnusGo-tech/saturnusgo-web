import { useState } from "react";
import type { Suite } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { MarkdownField } from "../../../cases/inspector/markdown/MarkdownField";
import { getSuiteDialogCopy } from "../copy";
import css from "../suite-dialog.module.css";

type Props = {
  retainedFilter?: Suite["filter"]; folders: readonly RepositoryFolder[]; name: string; description: string; type: Suite["type"]; tags: string; creating: boolean; ru: boolean;
  onName: (value: string) => void; onDescription: (value: string) => void;
  onType: (value: Suite["type"], restoring?: boolean) => void; onTags: (value: string) => void;
};
export function SuiteEditableFields(props: Props) {
  const copy = getSuiteDialogCopy(props.ru ? "ru" : "en");
  const [editingDescription, setEditingDescription] = useState(false);
  const rule = props.retainedFilter;
  const retained = [rule?.folderId ? props.folders.find(folder => folder.id === rule.folderId)?.path ?? (props.ru ? "Сохранённая папка" : "Saved folder") : rule?.folderPathPrefix,
    rule?.priority?.length ? `${props.ru ? "Приоритеты" : "Priorities"}: ${rule.priority.join(", ")}` : null,
    rule?.lifecycle?.length ? `${props.ru ? "Статусы" : "Statuses"}: ${rule.lifecycle.join(", ")}` : null,
    rule?.text ? `${props.ru ? "Текст" : "Text"}: ${rule.text}` : null].filter(Boolean);
  return <div className={css.fields}>
    <label className={css.nameField}><span>{copy.name}</span><input required maxLength={200} value={props.name}
      onChange={e => props.onName(e.target.value)} placeholder={copy.defaultName} /></label>
    <section className={css.description} aria-label={copy.description}>
      <div className={css.fieldLabel}><span>{copy.description} <small>{props.ru ? "необязательно" : "optional"}</small></span>
        {editingDescription && <button type="button" className={css.textButton} onClick={() => setEditingDescription(false)}>{props.ru ? "Готово" : "Done"}</button>}
      </div>
      <MarkdownField appearance="plain" label={copy.description} value={props.description} allowAttachments={false} compact autoFocus={editingDescription}
        onRequestEdit={() => setEditingDescription(true)} onChange={editingDescription ? props.onDescription : undefined}
        emptyLabel={props.ru ? "Добавьте цель или контекст набора" : "Add a purpose or context for this suite"} />
      {!editingDescription && <button className={css.descriptionEdit} type="button" onClick={() => setEditingDescription(true)}>
        {props.description ? (props.ru ? "Изменить описание" : "Edit description") : (props.ru ? "Добавить описание" : "Add description")}
      </button>}
    </section>
    <section className={css.membership}>
      <span className={css.fieldLabel}>{copy.mode}</span>
      <div className={css.modeGroup} role="group" aria-label={copy.mode}>
        <button type="button" aria-pressed={props.type === "static"} onClick={() => props.onType("static")}>{props.ru ? "Вручную" : "Manual selection"}</button>
        <button type="button" aria-pressed={props.type === "dynamic"} onClick={() => props.onType("dynamic")}>{props.ru ? "По тегам" : "By tags"}</button>
      </div>
      <p className={css.hint}>{props.type === "static" ? copy.staticModeHint : copy.dynamicModeHint}</p>
      {props.type === "dynamic" && <label className={css.tagsField}><span>{copy.tags}</span><input value={props.tags} onChange={e => props.onTags(e.target.value)} placeholder={copy.tagsPlaceholder} />
        <small>{props.ru ? "Кейс должен содержать все указанные теги. Разделяйте их запятыми." : "Cases must match all tags. Separate tags with commas."}</small></label>}
      {retained.length > 0 && <p className={css.hint}>{props.ru ? "Также сохранены условия" : "Also keeping the saved criteria"}: {retained.join(" · ")}</p>}
    </section>
  </div>;
}
