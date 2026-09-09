import { PiListChecks } from "react-icons/pi";
import type { ImportPlan } from "../model/import-plan";
import type { ImportCopy } from "../localization/import-copy";
import { ImportFolderBranch } from "./tree/ImportFolderBranch";
import css from "./import-cases.module.css";

export function ImportPreviewTree({ plan, copy }: { plan: ImportPlan; copy: ImportCopy }) {
  return <div className={css.preview}>
    <div className={css.previewHeading}><strong>{copy.preview}</strong><span>{copy.folderHint}</span></div>
    <ul className={css.tree} aria-label={copy.preview}>
      {plan.folders.filter((folder) => folder.parentPath === "/").map((folder) =>
        <ImportFolderBranch key={folder.path} folder={folder} plan={plan} level={0} copy={copy} />)}
      {plan.rootCaseIndices.map((index) => <li key={index} className={css.caseRow}>
        <PiListChecks size={16} aria-hidden="true" /><span>{plan.document.testCases[index]?.title}</span>
      </li>)}
    </ul>
  </div>;
}
