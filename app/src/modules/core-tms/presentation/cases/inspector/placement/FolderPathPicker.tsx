import { Listbox, ListboxItem } from "@heroui/react";
import { useEffect, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { FolderVisual } from "../../../../folders/presentation/appearance/visual/FolderVisual";
import { PropertyPopover, PropertySearch } from "../../../common/properties/select/PropertySelect";
import { FolderPathBreadcrumb } from "../../../common/breadcrumbs/path/FolderPathBreadcrumb";
import controls from "../../../common/properties/property-controls.module.css";
import css from "./folderPathPicker.module.css";

export function FolderPathPicker({ value, folders, onChange, ru, disabled, allowCreate = true, label: customLabel }: {
  value: string; folders: readonly string[]; onChange(value: string): void; ru: boolean; disabled?: boolean; allowCreate?: boolean; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => { if (disabled) { setOpen(false); setQuery(""); } }, [disabled]);
  const paths = [...new Set(["/", value, ...folders])].filter(Boolean);
  const search = query.trim();
  const candidate = search.startsWith("/") ? search : `/${search}`;
  const options = paths.filter(path => path.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const canCreate = allowCreate && Boolean(search) && !paths.includes(candidate);
  const choices = [...options.map(path => ({ path, create: false })), ...(canCreate ? [{ path: candidate, create: true }] : [])];
  const label = customLabel ?? (ru ? "Папка" : "Folder");
  const pathLabel = (path: string) => path === "/" ? (ru ? "Корень проекта" : "Project root") : path;
  function setMenu(next: boolean) {
    setOpen(next && !disabled);
    if (!next) setQuery("");
  }
  function choose(path: string) {
    if (disabled) return;
    onChange(path);
    setMenu(false);
  }
  function submitSearch(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || (event.target as HTMLElement).tagName !== "INPUT") return;
    event.preventDefault();
    event.stopPropagation();
    if (!search || disabled) return;
    if (paths.includes(candidate) || (canCreate && !options.length)) choose(candidate);
    else event.currentTarget.querySelector<HTMLElement>('[role=option]:not([aria-disabled=true])')?.focus();
  }
  return <div className={css.root}>
    <span className={css.label}>{label}</span>
    <PropertyPopover label={label} triggerLabel={`${label}, ${pathLabel(value)}`} open={open} onOpenChange={setMenu} disabled={disabled}
      menuClassName={css.menu} onMenuKeyDown={submitSearch} trigger={<>
        <FolderVisual path={value} /><span className={css.selection}><FolderPathBreadcrumb path={value} ru={ru}/></span><ChevronDown size={13} aria-hidden="true"/>
      </>}>
      <PropertySearch label={allowCreate ? (ru ? "Найти или создать папку" : "Find or create a folder") : (ru ? "Найти папку" : "Find a folder")} value={query} onChange={setQuery} disabled={disabled}/>
      <Listbox aria-label={label} classNames={{ base: controls.list, list: controls.options }}
        selectionMode="single" hideSelectedIcon disallowEmptySelection selectedKeys={[value]}
        emptyContent={ru ? "Ничего не найдено" : "No results"} itemClasses={{ base: `${controls.option} ${css.option}`, title: controls.optionTitle }}>
        {choices.map(({ path, create }) => <ListboxItem key={create ? `create:${path}` : path} textValue={create ? `${ru ? "Создать папку" : "Create folder"} ${path}` : pathLabel(path)}
          aria-label={create ? `${ru ? "Создать папку" : "Create folder"} ${path}` : pathLabel(path)}
          data-folder-path={create ? undefined : path} data-folder-create={create || undefined} isDisabled={disabled}
          onPress={() => choose(path)} startContent={create ? <Plus size={14} aria-hidden="true"/> : <FolderVisual path={path}/>}
          endContent={!create && path === value ? <Check className={controls.selectedIcon} size={14} aria-hidden="true"/> : undefined}>
          {create ? <span className={css.create}><span>{ru ? "Создать папку" : "Create folder"}</span><FolderPathBreadcrumb path={path} ru={ru}/></span> : <FolderPathBreadcrumb path={path} ru={ru}/>}
        </ListboxItem>)}
      </Listbox>
      {canCreate && <p className={css.hint}>{ru ? "Папка будет создана при сохранении кейса." : "The folder will be created when you save the case."}</p>}
    </PropertyPopover>
  </div>;
}
