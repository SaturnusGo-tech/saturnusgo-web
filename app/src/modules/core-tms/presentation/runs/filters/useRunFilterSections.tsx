import { useState } from "react";
import { CircleCheck, FolderKanban, ListTree, Users } from "lucide-react";
import { localizedLabel } from "../../../localization/format/labels";
import { useMemberName } from "../../../workspace/members/state/useMemberName";
import type { ExtraFilterSection } from "../../cases/toolbar/CasesToolbarPopovers";
import { RunFilterOptions } from "./options/RunFilterOptions";
import { RunAssigneeFilter } from "./assignee/RunAssigneeFilter";
import { matchesRunFilters } from "./run-filter-model";

export function useRunFilterSections({ workspaceId, projects, owner, setOwner, ru, offline }: {
  workspaceId: string; projects: readonly { id: string; name: string }[]; owner: string | null | undefined;
  setOwner: (value: string | null | undefined) => void; ru: boolean; offline: boolean;
}) {
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [result, setResult] = useState("all");
  const [group, setGroup] = useState("project");
  const member = useMemberName(workspaceId, owner ?? null, offline);
  const all = ru ? "Все" : "All";
  const grouping = [{ value: "project", label: ru ? "По проектам" : "By project" },
    { value: "component", label: ru ? "По компонентам" : "By component" }, { value: "tag", label: ru ? "По тегам" : "By tag" }];
  const sections: ExtraFilterSection[] = [
    { id: "assignee", label: ru ? "Ответственные" : "Assignees", icon: <Users size={13} />, active: owner !== undefined,
      summary: owner === undefined ? all : owner === null ? (ru ? "Не назначен" : "Not assigned") : member.name ?? (ru ? "Выбран" : "Selected"),
      render: () => <RunAssigneeFilter workspaceId={workspaceId} owner={owner} onChange={setOwner} ru={ru} /> },
    { id: "projects", label: ru ? "Проекты" : "Projects", icon: <FolderKanban size={13} />, active: projectIds.length > 0,
      summary: projectIds.length ? String(projectIds.length) : all,
      render: () => <RunFilterOptions label={ru ? "Проекты" : "Projects"} multiple placeholder={ru ? "Найти проект" : "Find a project"}
        options={[{ value: "all", label: ru ? "Все проекты" : "All projects" }, ...projects.map((project) => ({ value: project.id, label: project.name }))]}
        selected={projectIds.length ? projectIds : ["all"]} onChange={(id) => setProjectIds((current) => id === "all" ? [] : current.includes(id) ? current.filter((value) => value !== id) : [...current, id])} /> },
    { id: "results", label: ru ? "Результаты" : "Results", icon: <CircleCheck size={13} />, active: result !== "all",
      summary: result === "all" ? all : localizedLabel(ru ? "ru" : "en", result),
      render: () => <RunFilterOptions label={ru ? "Результаты" : "Results"} selected={[result]} onChange={setResult}
        options={[{ value: "all", label: ru ? "Все результаты" : "All results" }, ...["not_run", "in_progress", "passed", "failed", "blocked", "skipped"].map((value) => ({ value, label: localizedLabel(ru ? "ru" : "en", value) }))]} /> },
    { id: "grouping", label: ru ? "Группировка" : "Group by", icon: <ListTree size={13} />, active: group !== "project",
      summary: grouping.find((option) => option.value === group)!.label,
      render: () => <RunFilterOptions label={ru ? "Группировка" : "Group by"} options={grouping} selected={[group]} onChange={setGroup} /> },
  ];
  return { sections, group, matches: (row: Parameters<typeof matchesRunFilters>[0]) => matchesRunFilters(row, { owner, projectIds, result }),
    reset: () => { setOwner(undefined); setProjectIds([]); setResult("all"); setGroup("project"); } };
}
