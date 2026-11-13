import { useId, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FolderVisual } from "../../../../../folders/presentation/appearance/visual/FolderVisual";
import { useDisclosureMotion } from "../../../../../presentation/common/disclosure/useDisclosureMotion";
import { RELATED_UNFILED, type RelatedCaseFolder } from "../model/related-case-view";
import shared from "../../../../../presentation/dialogs/suite/picker/suite-picker.module.css";
import css from "../related-case-browser.module.css";

type Props = {
  folder: RelatedCaseFolder; childrenByParent: ReadonlyMap<string | null, RelatedCaseFolder[]>;
  current: string; ru: boolean; disabled: boolean; onChoose(id: string): void;
};

export function RelatedFolderBranch({ folder, childrenByParent, current, ru, disabled, onChoose }: Props) {
  const [open, setOpen] = useState(true);
  const disclosure = useDisclosureMotion(open);
  const childrenId = useId();
  const children = childrenByParent.get(folder.id) ?? [];
  const name = folder.id === RELATED_UNFILED ? (ru ? "Без папки" : "Unfiled") : folder.name;
  return <li className={css.branch}>
    <div className={shared.folderRow} style={{ paddingInlineStart: Math.min(folder.depth, 5) * 12 }}>
      {children.length ? <button type="button" className={shared.folderChevron} disabled={disabled}
        aria-label={`${open ? (ru ? "Свернуть" : "Collapse") : (ru ? "Развернуть" : "Expand")}: ${name}`}
        aria-expanded={open} aria-controls={childrenId} onClick={() => setOpen(value => !value)}>
        {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
      </button> : <span className={shared.folderChevronSpace} />}
      <button type="button" className={shared.folderButton} title={folder.path} disabled={disabled}
        aria-current={current === folder.id ? "page" : undefined} onClick={() => onChoose(folder.id)}>
        <FolderVisual folderId={folder.id} appearance={folder.appearance} open={Boolean(children.length && open)} />
        <span>{name}</span><small>{folder.caseIds.length}</small>
      </button>
    </div>
    {children.length > 0 && disclosure.present && <div id={childrenId} className={css.branchChildren} aria-hidden={!open || undefined}
      ref={element => { disclosure.ref.current = element; if (element) element.inert = !open; }}>
      <ul className={css.tree}>{children.map(child => <RelatedFolderBranch key={child.id} folder={child}
        childrenByParent={childrenByParent} current={current} ru={ru} disabled={disabled} onChoose={onChoose} />)}</ul>
    </div>}
  </li>;
}
