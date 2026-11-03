import type { FolderAppearance } from "../../../../folders/model/appearance/folder-appearance";
import { FolderVisual } from "../../../../folders/presentation/appearance/visual/FolderVisual";
import { Fragment } from "react";
import { PiCaretRight } from "react-icons/pi";
import css from "./folder-path.module.css";

export function SuiteFolderPath({ path, ru, unavailable = false, appearance, folderId, projectId }: { path: string; ru: boolean; unavailable?: boolean; appearance?: FolderAppearance; folderId?: string; projectId?: string }) {
  const segments = path.split("/").map(part => part.trim()).filter(Boolean);
  const fullPath = segments.length ? `/${segments.join("/")}` : "/";
  const missing = ru ? "Папка недоступна" : "Folder unavailable";
  return <span className={css.path} title={unavailable ? `${missing}${segments.length ? ` · ${fullPath}` : ""}` : fullPath}
    data-unavailable={unavailable || undefined}>
    <FolderVisual appearance={unavailable ? null : appearance} folderId={unavailable ? undefined : folderId} path={unavailable ? undefined : path} projectId={projectId} />
    <span className={css.segments}>{unavailable ? <span>{missing}</span> : segments.length ? segments.map((segment, index) =>
      <Fragment key={`${index}:${segment}`}>
        {index > 0 && <PiCaretRight size={10} aria-hidden="true" />}<span data-folder-segment>{segment}</span>
      </Fragment>) : <span>{ru ? "Без папки" : "Unfiled"}</span>}
    </span>
  </span>;
}
