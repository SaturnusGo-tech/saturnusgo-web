import { Button } from "@heroui/react";
import { Database, Plus, Table2, X } from "lucide-react";
import type { useResourceWorkspace } from "../../application/library/useResourceWorkspace";
import css from "./workspace-tabs.module.css";

export function WorkspaceTabs({ workspace, ru }: { workspace: ReturnType<typeof useResourceWorkspace>; ru: boolean }) {
  const current = workspace.selection;
  const parent = current?.mode === "source" || current?.mode === "view" ? current.dataset : null;
  const name = current?.mode === "create"
    ? (current.kind === "credentials" ? (ru ? "Новые учётные данные" : "New credential") : current.kind === "static" ? (ru ? "Новое значение" : "New static data") : (ru ? "Новый датасет" : "New dataset"))
    : current?.mode === "view" ? current.view.name : current?.resource.name;
  const Icon = current?.mode === "view" ? Table2 : Database;
  return <nav className={css.tabs} aria-label={ru ? "Открытый ресурс" : "Open resource"}>
    {parent && <Button disableRipple className={css.parent} onPress={() => workspace.selectDataset(parent)}><Database size={14} /><span>{parent.name}</span></Button>}
    {current && <div className={css.tab} aria-current="page"><Icon size={14} /><span title={name}>{name}</span>
      <Button disableRipple isIconOnly className={css.close} aria-label={ru ? "Закрыть ресурс" : "Close resource"} onPress={workspace.close}><X size={12} /></Button>
    </div>}
    {workspace.feature?.permissions.create && <Button disableRipple isIconOnly className={css.add} aria-label={ru ? "Новый датасет" : "New dataset"} onPress={() => workspace.create("datasets")}><Plus size={17} /></Button>}
  </nav>;
}
