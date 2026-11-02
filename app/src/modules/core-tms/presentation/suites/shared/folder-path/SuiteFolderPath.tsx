import { Fragment } from "react";
import { PiCaretRight, PiFolderSimpleDuotone } from "react-icons/pi";
import css from "./folder-path.module.css";

export function SuiteFolderPath({ path, ru, unavailable = false }: { path: string; ru: boolean; unavailable?: boolean }) {
  const segments = path.split("/").map(part => part.trim()).filter(Boolean);
  const fullPath = segments.length ? `/${segments.join("/")}` : "/";
  const missing = ru ? "Папка недоступна" : "Folder unavailable";
  return <span className={css.path} title={unavailable ? `${missing}${segments.length ? ` · ${fullPath}` : ""}` : fullPath}
    data-unavailable={unavailable || undefined}>
    <PiFolderSimpleDuotone size={16} aria-hidden="true" />
    <span className={css.segments}>{unavailable ? <span>{missing}</span> : segments.length ? segments.map((segment, index) =>
      <Fragment key={`${index}:${segment}`}>
        {index > 0 && <PiCaretRight size={10} aria-hidden="true" />}<span data-folder-segment>{segment}</span>
      </Fragment>) : <span>{ru ? "Без папки" : "Unfiled"}</span>}
    </span>
  </span>;
}
