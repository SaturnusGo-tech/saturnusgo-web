import { useWorkspaceMembers } from "../../../../workspace/members/state/useWorkspaceMembers";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { RunFilterOptions } from "../options/RunFilterOptions";
import css from "../options/run-filter-options.module.css";

export function RunAssigneeFilter({ workspaceId, selected, onChange, ru }: {
  workspaceId: string; selected: string[]; onChange: (value: string) => void; ru: boolean;
}) {
  const members = useWorkspaceMembers(workspaceId, true);
  return <RunFilterOptions label={ru ? "Ответственные" : "Assignees"} multiple selected={selected.length?selected:["all"]}
    options={[{ value: "all", label: ru ? "Все ответственные" : "All assignees" }, { value: "unassigned", label: ru ? "Не назначен" : "Not assigned" },
      ...members.items.map((member) => ({ value: member.id, label: member.name, detail: member.email,
        avatar: <MemberAvatar identityId={member.id} name={member.name} /> }))]}
    onChange={onChange}
    search={members.search} onSearch={members.setSearch} placeholder={ru ? "Имя или почта" : "Name or email"}>
    {members.loading && <div className={css.loading} role="status" aria-label={ru ? "Загрузка участников" : "Loading members"} />}
    {members.error && <button type="button" onClick={members.retry}>{ru ? "Не удалось загрузить. Повторить" : "Could not load. Retry"}</button>}
    {members.cursor && <button type="button" disabled={members.loading} onClick={members.more}>{ru ? "Загрузить ещё" : "Load more"}</button>}
  </RunFilterOptions>;
}
