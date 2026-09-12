import { useEffect, useState } from "react";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../folders/model/folder";
import { SelectionTree } from "../../../presentation/cases/selection/tree/SelectionTree";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import css from "./portfolio-repository.module.css";

const none = new Set<string>();
export function PortfolioCaseTree({ cases, folders, workspaceId, activeId, disabled, ru, includeArchived, onOpen }: {
  cases: TestCaseSummary[]; folders: readonly RepositoryFolder[]; workspaceId: string; activeId: string;
  disabled: boolean; ru: boolean; includeArchived: boolean; onOpen: (item: TestCaseSummary) => void;
}) {
  const [limit, setLimit] = useState(200);
  const signature = cases.map(item => item.id).join("\n");
  useEffect(() => setLimit(200), [signature]);
  return <>
    <SelectionTree cases={cases.slice(0, limit)} folders={folders} selected={none} ru={ru} disabled={disabled}
      activeId={activeId} includeArchived={includeArchived} onToggle={() => {}} onScope={() => {}} onOpen={onOpen}
      trailing={item => <span className={css.owner}><ResponsibleName workspaceId={workspaceId} identityId={item.ownerIdentityId} /></span>} />
    {cases.length > limit && <button className={css.more} type="button" onClick={() => setLimit(value => value + 200)}>
      {ru ? `Показать ещё · ${limit} из ${cases.length}` : `Show more · ${limit} of ${cases.length}`}</button>}
  </>;
}
