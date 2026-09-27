import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Check, ChevronDown, Folder, Plus, Search } from "lucide-react";
import { useAnchoredPopup } from "../../../common/popup/useAnchoredPopup";
import css from "./folderPathPicker.module.css";

export function FolderPathPicker({ value, folders, onChange, ru, disabled }: {
  value: string; folders: readonly string[]; onChange(value: string): void; ru: boolean; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);
  const visible = open && !disabled;
  useAnchoredPopup(visible, false, root, trigger, panel, close, 320);
  const paths = [...new Set(["/", value, ...folders])].filter(Boolean);
  const search = query.trim();
  const candidate = search.startsWith("/") ? search : `/${search}`;
  const options = paths.filter(path => path.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const canCreate = Boolean(search) && !paths.includes(candidate);
  function choose(path: string) {
    if (disabled) return;
    onChange(path);
    close();
    trigger.current?.focus();
  }
  function choices() {
    return Array.from(panel.current?.querySelectorAll<HTMLButtonElement>("[data-folder-choice]:not(:disabled)") ?? []);
  }
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (!visible) return;
    if (event.key === "Escape") {
      event.preventDefault(); event.stopPropagation(); close(); trigger.current?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const buttons = choices();
      if (!buttons.length) return;
      event.preventDefault();
      const current = buttons.findIndex(button => button === document.activeElement);
      const next = current < 0 ? (event.key === "ArrowDown" ? 0 : buttons.length - 1)
        : (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
  }
  function submitSearch(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || event.nativeEvent?.isComposing) return;
    event.preventDefault();
    if (!search) return;
    if (paths.includes(candidate) || (canCreate && !options.length)) choose(candidate);
    else choices()[0]?.focus();
  }
  return <div className={css.root} ref={root} onKeyDown={navigate}>
    <span className={css.label}>{ru ? "Папка" : "Folder"}</span>
    <button type="button" ref={trigger} disabled={disabled} className={css.trigger} aria-label={ru ? "Папка" : "Folder"}
      aria-haspopup="dialog" aria-expanded={visible} aria-controls={visible ? panelId : undefined}
      onClick={() => { setQuery(""); setOpen(!open); }}>
      <Folder size={14} aria-hidden="true"/><FolderBreadcrumb path={value}/><ChevronDown size={13} aria-hidden="true"/>
    </button>
    {visible && <div id={panelId} className={css.panel} ref={panel} popover="manual" role="dialog" aria-label={ru ? "Выбрать папку" : "Choose folder"}>
      <label className={css.search}><Search size={14} aria-hidden="true"/>
        <input autoFocus value={query} onChange={event => setQuery(event.target.value)} onKeyDown={submitSearch}
          placeholder={ru ? "Найти или создать папку" : "Find or create a folder"}
          aria-label={ru ? "Путь к папке" : "Folder path"}/>
      </label>
      <div className={css.options}>
        {options.map(path => <button type="button" key={path} data-folder-choice data-folder-path={path}
          aria-pressed={path === value} onClick={() => choose(path)}>
          <FolderBreadcrumb path={path}/>{path === value && <Check size={14} aria-hidden="true"/>}
        </button>)}
        {canCreate && <button type="button" className={css.create} data-folder-choice data-folder-create onClick={() => choose(candidate)}>
          <Plus size={14} aria-hidden="true"/><span>{ru ? "Создать папку" : "Create folder"}<FolderBreadcrumb path={candidate}/></span>
        </button>}
      </div>
      {canCreate && <p className={css.hint}>{ru ? "Папка будет создана при сохранении кейса." : "The folder will be created when you save the case."}</p>}
    </div>}
  </div>;
}

function FolderBreadcrumb({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean);
  return <span className={css.crumbs}>{parts.map((part, index) => <span key={index}>
    {index > 0 && <ArrowRight size={11} aria-hidden="true"/>}<span>{part}</span>
  </span>)}{!parts.length && "/"}</span>;
}
