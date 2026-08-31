import { Folder, FolderPlus } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { getFolderDialogCopy } from "./copy";
import shared from "../../../tms.module.css";
import styles from "./FolderDialog.module.css";
export function FolderDialog({ existing, selectedParent, onClose, onCreated }: { existing: string[]; selectedParent: string; onClose: () => void; onCreated: (path: string) => void }) {
  const { locale } = useTmsLocale();
  const copy = getFolderDialogCopy(locale);
  const [name, setName] = useState("");
  const [parent, setParent] = useState(selectedParent && selectedParent !== "/Unsorted" ? selectedParent : "/");
  const cleanName = name.trim().replace(/^\/+|\/+$/g, "");
  const path = `${parent === "/" ? "" : parent}/${cleanName}`.replace(/\/{2,}/g, "/") || "/Unsorted";
  const duplicate = existing.includes(path);
  const parents = [
    { value: "/", label: copy.root },
    ...Array.from(new Set(existing)).sort((left, right) => left.localeCompare(right)).map((folderName) => ({ value: folderName, label: folderName })),
  ];
  return <Modal title={copy.title} subtitle={copy.subtitle} onClose={onClose} drawer panelClassName={styles.drawer}>
    <form className={`${shared.drawerForm} ${shared.productionDrawerForm}`} onSubmit={(event) => { event.preventDefault(); if (cleanName && !duplicate) onCreated(path); }}>
      <div className={`${shared.drawerBody} ${styles.body}`}>
        <div className={shared.formGrid}>
        <Field label={copy.name} wide><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} data-testid="folder-name" /></Field>
        <Field label={copy.parent} wide><AnimatedSelect label={copy.parent} value={parent} options={parents} onChange={setParent} /></Field>
        </div>
        <div className={`${styles.path} ${duplicate ? styles.pathError : ""}`}>
          <Folder size={16} aria-hidden="true" />
          <span><small>{copy.path}</small><strong>{path}</strong>{duplicate && <em>{copy.duplicate}</em>}</span>
        </div>
      </div>
      <div className={shared.modalFooter}><button type="button" className={shared.textButton} onClick={onClose}>{copy.cancel}</button><button className={shared.primaryButton} disabled={!cleanName || duplicate}><FolderPlus size={16} /> {copy.create}</button></div>
    </form>
  </Modal>;
}
