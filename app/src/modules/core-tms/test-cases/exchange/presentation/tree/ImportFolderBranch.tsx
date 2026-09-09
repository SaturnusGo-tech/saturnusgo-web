import { ChevronRight, FileText } from "lucide-react";
import { PiFolderDuotone } from "react-icons/pi";
import { useState } from "react";
import type { ImportPlan, ImportFolderPreview } from "../../model/import-plan";
import type { ImportCopy } from "../../localization/import-copy";
import css from "../import-cases.module.css";

export function ImportFolderBranch({ folder, plan, level, copy }: {
  folder: ImportFolderPreview; plan: ImportPlan; level: number; copy: ImportCopy;
}) {
  const [open, setOpen] = useState(level < 1);
  const children = plan.folders.filter((item) => item.parentPath === folder.path);
  const count = children.length + folder.caseIndices.length;
  return <li>
    <button type="button" className={css.folderRow} onClick={() => setOpen(!open)}
      aria-expanded={count ? open : undefined} disabled={!count} title={folder.path}>
      <ChevronRight size={14} className={css.chevron} data-open={open && count > 0} data-hidden={!count} aria-hidden="true" />
      <PiFolderDuotone size={21} className={css.folderIcon} aria-hidden="true" /><span>{folder.name}</span>
      <small data-existing={folder.exists}>{folder.exists ? copy.existing : copy.new}</small>
    </button>
    {open && count > 0 && <ul className={css.treeChildren}>
      {children.map((child) => <ImportFolderBranch key={child.path} folder={child} plan={plan} level={level + 1} copy={copy} />)}
      {folder.caseIndices.map((index) => <li key={index} className={css.caseRow}>
        <FileText size={15} aria-hidden="true" /><span>{plan.document.testCases[index]?.title}</span>
      </li>)}
    </ul>}
    {!count && <p className={css.emptyFolder}>{copy.empty}</p>}
  </li>;
}
