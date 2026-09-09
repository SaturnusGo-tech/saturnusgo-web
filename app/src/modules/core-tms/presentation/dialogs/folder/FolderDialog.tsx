import { PiFolderDuotone as Folder, PiFolderPlusDuotone as FolderPlus } from "react-icons/pi";
import { useState } from "react";
import type { FormEvent } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import { ParentFolderPicker } from "./parent/ParentFolderPicker";
import { getFolderDialogCopy } from "./copy";
import shared from "../../../tms.module.css";
import styles from "./FolderDialog.module.css";
export function FolderDialog({ existing, selectedParent, onClose, onCreated, initialName, editing, busy, error }: { existing: string[]; selectedParent: string; onClose: () => void; onCreated: (path: string) => void; initialName?: string; editing?: boolean; busy?: boolean; error?: string }) {
  const { locale } = useTmsLocale();
  const copy = getFolderDialogCopy(locale);
  const [name, setName] = useState(initialName ?? "");
  const [parent, setParent] = useState(selectedParent || "/");
  const cleanName = name.trim().replace(/^\/+|\/+$/g, "");
  const path = `${parent === "/" ? "" : parent}/${cleanName}`.replace(/\/{2,}/g, "/") || "/Unsorted";
  const duplicate = existing.includes(path);
  const validParent = parent === "/" || existing.includes(parent);
  const parents = [
    { value: "/", label: copy.root },
    ...Array.from(new Set(existing.filter((path) => path !== "/"))).sort((left, right) => left.localeCompare(right)).map((folderName) => ({ value: folderName, label: folderName })),
  ];
  function submit(event: FormEvent) {
    event.preventDefault();
    if (cleanName && !duplicate && !busy && validParent && !cleanName.includes("/")) onCreated(path);
  }

  return <Modal title={editing ? (locale === "ru" ? "Настроить папку" : "Edit folder") : copy.title} onClose={onClose} panelClassName={styles.dialog}>
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.body}>
        <p className={styles.subtitle}>{copy.subtitle}</p>
        <div className={styles.fields}>
          <Field label={copy.name} wide>
            <input required maxLength={120} disabled={busy} autoFocus data-autofocus value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} data-testid="folder-name" />
          </Field>
          <div className={shared.formField} role="group" aria-label={copy.parent}><span>{copy.parent}</span>
            <ParentFolderPicker label={copy.parent} searchLabel={copy.searchParent} emptyLabel={copy.noFolders} value={parent} options={parents} onChange={setParent} />
          </div>
        </div>
        <div className={`${styles.path} ${duplicate ? styles.pathError : ""}`}>
          <Folder size={16} aria-hidden="true" />
          <span><small>{copy.path}</small><strong>{path}</strong>{duplicate && <em>{copy.duplicate}</em>}</span>
        </div>
      </div>
      {!validParent && <p role="alert" className={styles.error}>{locale === "ru" ? "Выберите существующую родительскую папку." : "Select an existing parent folder."}</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.footer}>
        <button type="button" className={shared.textButton} onClick={onClose}>{copy.cancel}</button>
        <button className={shared.primaryButton} disabled={!cleanName || duplicate || busy || !validParent || cleanName.includes("/")}>
          <FolderPlus size={15} /> {editing ? (locale === "ru" ? "Сохранить" : "Save") : copy.create}
        </button>
      </div>
    </form>
  </Modal>;
}
