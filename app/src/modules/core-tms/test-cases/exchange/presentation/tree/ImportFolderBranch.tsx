import { FolderVisual } from "../../../../folders/presentation/appearance/visual/FolderVisual";
import { ChevronRight } from "lucide-react";
import { PriorityIcon } from "../../../../presentation/common/properties/PriorityIcon";
import { useState } from "react";
import type { ImportPlan, ImportFolderPreview } from "../../model/import-plan";
import type { ImportCopy } from "../../localization/import-copy";
import css from "../import-cases.module.css";

export function ImportFolderBranch({ folder, plan, level, copy, neutral = false }: {
  folder: ImportFolderPreview; plan: ImportPlan; level: number; copy: ImportCopy; neutral?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const children = plan.folders.filter((item) => item.parentPath === folder.path);
  const count = children.length + folder.caseIndices.length;
  return <li>
    <button type="button" className={css.folderRow} onClick={() => setOpen(!open)}
      aria-expanded={count ? open : undefined} disabled={!count} title={folder.name}>
      <ChevronRight size={14} className={css.chevron} data-open={open && count > 0} data-hidden={!count} aria-hidden="true" />
      <FolderVisual appearance={folder.appearance ?? null} folderId={folder.folderId} open={open} /><span>{folder.name}</span>
      {!neutral && <small data-existing={folder.exists}>{folder.exists ? copy.existing : copy.new}</small>}
    </button>
    {open && count > 0 && <ul className={css.treeChildren}>
      {children.map((child) => <ImportFolderBranch key={child.path} folder={child} plan={plan} level={level + 1} copy={copy} neutral={neutral} />)}
      {folder.caseIndices.map((index) => <li key={index} className={css.caseRow}>
        <PriorityIcon level={plan.document.testCases[index]?.priority} /><span>{plan.document.testCases[index]?.title}</span>
        {plan.document.testCases[index]?.sourceKey && <small>{plan.document.testCases[index]?.sourceKey}</small>}
      </li>)}
    </ul>}
    {!count && <p className={css.emptyFolder}>{copy.empty}</p>}
  </li>;
}
