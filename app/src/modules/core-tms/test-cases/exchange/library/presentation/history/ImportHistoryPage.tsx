import { Select, SelectItem } from "@heroui/react";
import { useState } from "react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { ImportHistory } from "./ImportHistory";
import css from "../page/import-page.module.css";

export function ImportHistoryPage({ workspaceId, projects, initialProjectId, revision, canManage }: {
  workspaceId: string; projects: readonly Project[]; initialProjectId: string; revision: number; canManage: boolean;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const [projectId, setProjectId] = useState(initialProjectId);
  const selected = projects.find(project => project.id === projectId);
  return <section className={css.historyPage}>
    <Select label={ru ? "Проект" : "Project"} labelPlacement="outside" variant="flat" className={css.projectSelect}
      classNames={{ base: css.selectBase, label: css.selectLabel, trigger: css.selectTrigger, innerWrapper: css.selectInner, value: css.selectValue, selectorIcon: css.selectIcon, popoverContent: css.selectPopover }}
      listboxProps={{ classNames: { base: css.listbox, list: css.options }, itemClasses: { base: css.option } }}
      selectedKeys={selected ? [selected.id] : []} disallowEmptySelection onSelectionChange={keys => {
        if (keys !== "all") { const id = Array.from(keys)[0]; if (id && projects.some(project => project.id === id)) setProjectId(String(id)); }
      }}>{projects.map(project => <SelectItem key={project.id} textValue={project.name}>{project.name}</SelectItem>)}</Select>
    {selected && <ImportHistory key={projectId} scope={{ workspaceId, projectId }} revision={revision} canManage={canManage} />}
  </section>;
}
