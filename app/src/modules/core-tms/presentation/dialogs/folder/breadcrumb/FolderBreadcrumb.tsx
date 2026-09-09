import { PiCaretRight } from "react-icons/pi";
import css from "./folder-breadcrumb.module.css";
export function FolderBreadcrumb({ path, root }: { path: string; root?: string }) {
  const parts = path.split("/").filter(Boolean);
  return <span className={css.trail}>{(parts.length ? parts : [root ?? ""]).map((part, index) => <span key={`${index}:${part}`}>
    {index > 0 && <PiCaretRight size={11} aria-hidden="true" />}<span>{part}</span>
  </span>)}</span>;
}
