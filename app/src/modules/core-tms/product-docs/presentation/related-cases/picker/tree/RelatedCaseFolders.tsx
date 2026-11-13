import { FolderVisual } from "../../../../../folders/presentation/appearance/visual/FolderVisual";
import type { RelatedCaseFolder } from "../model/related-case-view";
import { RelatedFolderBranch } from "./RelatedFolderBranch";
import shared from "../../../../../presentation/dialogs/suite/picker/suite-picker.module.css";
import css from "../related-case-browser.module.css";

export function RelatedCaseFolders({ folders, count, current, projectName, ru, disabled, onChoose }: {
  folders: readonly RelatedCaseFolder[]; count: number; current: string; projectName: string;
  ru: boolean; disabled: boolean; onChoose(id: string): void;
}) {
  const present = new Set(folders.map(folder => folder.id));
  const children = new Map<string | null, RelatedCaseFolder[]>();
  folders.forEach(folder => {
    const parent = folder.parentId && present.has(folder.parentId) ? folder.parentId : null;
    children.set(parent, [...children.get(parent) ?? [], folder]);
  });
  return <nav className={shared.folderNav} aria-label={ru ? "Папки тест-кейсов" : "Test case folders"}>
    <span className={shared.folderHeading} title={projectName}>{projectName}</span>
    <button type="button" className={shared.allFolders} aria-current={!current ? "page" : undefined} disabled={disabled} onClick={() => onChoose("")}>
      <FolderVisual /><span>{ru ? "Все кейсы" : "All cases"}</span><small>{count}</small>
    </button>
    <ul className={css.tree}>{(children.get(null) ?? []).map(folder => <RelatedFolderBranch key={folder.id}
      folder={folder} childrenByParent={children} current={current} ru={ru} disabled={disabled} onChoose={onChoose} />)}</ul>
  </nav>;
}
