import { Folder, FolderPlus } from "lucide-react";
import { useState } from "react";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import styles from "../../../tms.module.css";
export function FolderDialog({ existing, selectedParent, onClose, onCreated }: { existing: string[]; selectedParent: string; onClose: () => void; onCreated: (path: string) => void }) {
  const [name, setName] = useState("");
  const [parent, setParent] = useState(selectedParent && selectedParent !== "/Unsorted" ? selectedParent : "/");
  const cleanName = name.trim().replace(/^\/+|\/+$/g, "");
  const path = `${parent === "/" ? "" : parent}/${cleanName}`.replace(/\/{2,}/g, "/") || "/Unsorted";
  const duplicate = existing.includes(path);
  return <Modal title="Create repository folder" subtitle="Use folders to mirror features, services, or release areas." onClose={onClose}>
    <form onSubmit={(event) => { event.preventDefault(); if (cleanName && !duplicate) onCreated(path); }}>
      <div className={styles.formGrid}>
        <Field label="Folder name" wide><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Authentication" data-testid="folder-name" /></Field>
        <Field label="Parent folder" wide><select value={parent} onChange={(event) => setParent(event.target.value)}><option value="/">Repository root</option>{existing.map((folderName) => <option key={folderName} value={folderName}>{folderName}</option>)}</select></Field>
      </div>
      <div className={`${styles.pathPreview} ${duplicate ? styles.pathPreviewError : ""}`}><Folder size={17} /><span><small>Folder path</small><strong>{path}</strong>{duplicate && <em>This folder already exists</em>}</span></div>
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} disabled={!cleanName || duplicate}><FolderPlus size={16} /> Create folder</button></div>
    </form>
  </Modal>;
}
