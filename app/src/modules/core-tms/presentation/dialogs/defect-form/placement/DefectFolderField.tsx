import { Button } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FolderVisual } from "../../../../folders/presentation/appearance/visual/FolderVisual";
import { FolderPathBreadcrumb } from "../../../common/breadcrumbs/path/FolderPathBreadcrumb";
import { PropertyPopover } from "../../../common/properties/select/PropertySelect";
import { ParentFolderPicker } from "../../folder/parent/ParentFolderPicker";
import type { DefectTraceabilityChoices } from "../model";
import css from "./placement.module.css";

export function DefectFolderField({ value, choices, onChange, ru, disabled }: {
  value: string | null | undefined; choices: DefectTraceabilityChoices; onChange(id: string | null | undefined): void; ru: boolean; disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const folders = choices.folders.filter(folder => !folder.archivedAt);
  const current = folders.find(folder => folder.id === value);
  const path = value === null ? "/" : current?.path;
  const placeholder = value === undefined ? (ru ? "Выбрать папку" : "Choose a folder") : (ru ? "Папка недоступна" : "Folder unavailable");
  const label = ru ? "Папка" : "Folder";
  const options = [{ value: "/", label: ru ? "Корень проекта" : "Project root" },
    ...folders.map(folder => ({ value: folder.path, label: folder.path }))];
  return <div className={css.field}>
    <span className={css.label}>{label}</span>
    <PropertyPopover label={label} triggerLabel={`${label}, ${path ?? placeholder}`} open={open}
      onOpenChange={setOpen} disabled={disabled || choices.loading || Boolean(choices.error)} menuClassName={css.menu}
      trigger={<><FolderVisual path={path ?? "/"} /><span className={css.path}>{path ? <FolderPathBreadcrumb path={path} ru={ru} /> : placeholder}</span><ChevronDown size={13} /></>}>
      {value !== undefined && <Button type="button" variant="light" className={css.clear}
        onPress={() => { onChange(undefined); setOpen(false); }}>{ru ? "Не указывать папку" : "Leave folder unspecified"}</Button>}
      <ParentFolderPicker inline value={path ?? ""} options={options} label={label}
        searchLabel={ru ? "Найти папку" : "Find a folder"} emptyLabel={ru ? "Папки не найдены" : "No folders found"}
        onChange={next => { const folder = folders.find(entry => entry.path === next); if (next === "/" || folder) onChange(folder?.id ?? null); setOpen(false); }} />
    </PropertyPopover>
    {(choices.loading || choices.error) && <small role="status" className={css.status}>{choices.loading
      ? (ru ? "Загрузка папок…" : "Loading folders…") : (ru ? "Не удалось загрузить папки." : "Could not load folders.")}</small>}
  </div>;
}
