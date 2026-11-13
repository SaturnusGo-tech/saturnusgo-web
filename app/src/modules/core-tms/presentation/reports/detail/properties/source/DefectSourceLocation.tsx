import { Button } from "@heroui/react";
import { Folder } from "lucide-react";
import type { Defect } from "../../../../../../../core/tms/contracts/legacy-contract";
import { FolderPathBreadcrumb } from "../../../../common/breadcrumbs/path/FolderPathBreadcrumb";
import css from "./source-location.module.css";

export function DefectSourceLocation({ location, ru, onOpen, pending, error, projectName }: {
  projectName?: string; location: Defect["sourceLocation"]; ru: boolean; onOpen?: () => void; pending?: boolean; error?: string;
}) {
  const label = ru ? "Папка" : "Folder";
  const path = location?.folderPath;
  return <div className={css.source}>
    <dt><Folder size={15} aria-hidden="true" /><span>{label}</span></dt>
    <dd>{path ? onOpen ? <Button type="button" variant="light" className={css.link}
      aria-label={ru ? `Открыть текущую папку: ${path}` : `Open current folder: ${path}`} aria-busy={pending}
      isDisabled={pending} onPress={onOpen}><FolderPathBreadcrumb path={path} ru={ru} rootLabel={projectName} /></Button>
      : <span className={css.path}><FolderPathBreadcrumb path={path} ru={ru} rootLabel={projectName} /></span>
      : <span className={css.missing}>{ru ? "Не сохранена" : "Not captured"}</span>}
      {error && <small className={css.error} role="status">{error}</small>}
    </dd>
  </div>;
}
