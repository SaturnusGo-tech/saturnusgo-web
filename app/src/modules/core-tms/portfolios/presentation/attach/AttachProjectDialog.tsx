import { useState } from "react";
import { PiFolderSimpleLight, PiMagnifyingGlass } from "react-icons/pi";
import { formatTmsMutationFailure, type TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { Modal } from "../../../presentation/common/modal/Modal";
import { FormError } from "../../../presentation/common/error/FormError";
import type { PortfolioCopy } from "../../model/copy";
import { useAttachProjects } from "../../state/detail/useAttachProjects";
import { ResourceFeedback } from "../common/ResourceFeedback";
import styles from "../styles/dialog.module.css";

export function AttachProjectDialog({ workspaceId, copy, pending, error, onAttach, onClose }: {
  workspaceId: string; copy: PortfolioCopy; pending: boolean; error: TmsMutationFailure | null; onAttach: (id: string) => Promise<void>; onClose: () => void;
}) {
  const page = useAttachProjects(workspaceId);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const items = page.items.filter((project) => `${project.name} ${project.key}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <Modal title={copy.attach} onClose={onClose} panelClassName={styles.panel}>
    <form className={styles.form} onSubmit={(event) => { event.preventDefault(); if (selected) void onAttach(selected); }}>
      <div className={styles.body}>
        <p className={styles.note}>{copy.attachHint}</p>
        <label className={styles.search} data-input-shell><PiMagnifyingGlass aria-hidden="true" /><input autoFocus data-autofocus aria-label={copy.searchProject}
          value={search} onChange={(event) => { setSearch(event.target.value); setSelected(null); }} placeholder={copy.searchProject} /></label>
        <ResourceFeedback loading={page.loading} error={page.error} copy={copy} retry={page.reload} />
        <fieldset className={styles.choices}><legend className={styles.srOnly}>{copy.choose}</legend>
          {items.map((project) => <label key={project.id} className={styles.choice} data-selected={selected === project.id}>
            <PiFolderSimpleLight size={25} aria-hidden="true" /><span>{project.name}<small>{project.key}</small></span>
            <input type="radio" name="project" value={project.id} checked={selected === project.id} disabled={pending} onChange={() => setSelected(project.id)} />
          </label>)}
        </fieldset>
        {!items.length && !page.loading && !page.error && <p className={styles.note}>{search ? copy.noResultsHint : copy.attachEmptyHint}</p>}
        {page.cursor && <button type="button" disabled={page.loading} className={styles.loadMore} onClick={page.loadMore}>{copy.loadMore}</button>}
        {error && <FormError message={formatTmsMutationFailure(error, copy.saveError)} />}
      </div>
      <footer className={styles.footer}><button type="button" onClick={onClose}>{copy.cancel}</button>
        <button className={styles.primary} disabled={!selected || pending}>{pending ? copy.saving : copy.attachAction}</button>
      </footer>
    </form>
  </Modal>;
}
