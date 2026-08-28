import { Folder, FolderPlus } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import { getFolderDialogCopy } from "./copy";
import styles from "../../../tms.module.css";
export function FolderDialog({ existing, selectedParent, onClose, onCreated }: { existing: string[]; selectedParent: string; onClose: () => void; onCreated: (path: string) => void }) {
  const { locale } = useTmsLocale();
  const copy = getFolderDialogCopy(locale);
  const [name, setName] = useState("");
  const [parent, setParent] = useState(selectedParent && selectedParent !== "/Unsorted" ? selectedParent : "/");
  const cleanName = name.trim().replace(/^\/+|\/+$/g, "");
  const path = `${parent === "/" ? "" : parent}/${cleanName}`.replace(/\/{2,}/g, "/") || "/Unsorted";
  const duplicate = existing.includes(path);
  return <Modal title={copy.title} subtitle={copy.subtitle} onClose={onClose}>
    <form onSubmit={(event) => { event.preventDefault(); if (cleanName && !duplicate) onCreated(path); }}>
      <div className={styles.formGrid}>
        <Field label={copy.name} wide><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} data-testid="folder-name" /></Field>
        <Field label={copy.parent} wide><select value={parent} onChange={(event) => setParent(event.target.value)}><option value="/">{copy.root}</option>{existing.map((folderName) => <option key={folderName} value={folderName}>{folderName}</option>)}</select></Field>
      </div>
      <div className={`${styles.pathPreview} ${duplicate ? styles.pathPreviewError : ""}`}><Folder size={17} /><span><small>{copy.path}</small><strong>{path}</strong>{duplicate && <em>{copy.duplicate}</em>}</span></div>
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button><button className={styles.primaryButton} disabled={!cleanName || duplicate}><FolderPlus size={16} /> {copy.create}</button></div>
    </form>
  </Modal>;
}
