import { Search } from "lucide-react";
import { IntegrationInput } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import type { useResourceWorkspace } from "../../application/library/useResourceWorkspace";
import { DatasetNode } from "../dataset-tree/DatasetNode";
import { WorkspaceFilter } from "../workspace-filter/WorkspaceFilter";
import { ResourceBranch } from "./ResourceBranch";
import shared from "../shared/data.module.css";
import css from "./resource-tree.module.css";

export function ResourceTree({ workspace, ru }: { workspace: ReturnType<typeof useResourceWorkspace>; ru: boolean }) {
  const selectedId = workspace.selection && "resource" in workspace.selection ? workspace.selection.resource.id : workspace.selection?.mode === "view" ? workspace.selection.view.id : undefined;
  return <aside className={css.tree} aria-label={ru ? "Ресурсы тестовых данных" : "Test data resources"}>
    <header className={css.heading}><h1>{ru ? "Тестовые данные" : "Test Data"}</h1></header>
    <div className={css.search}><IntegrationInput type="search" className={css.searchField} startContent={<Search size={15} />} aria-label={ru ? "Найти тестовые данные" : "Find test data"}
      placeholder={ru ? "Найти тестовые данные" : "Find test data"} value={workspace.datasets.search} onValueChange={workspace.search}
      classNames={{ inputWrapper: shared.inputShell, input: shared.input }} />
      <WorkspaceFilter ru={ru} sort={workspace.sort} archived={workspace.archived} setSort={workspace.setSort} setArchived={workspace.setArchived} />
    </div>
    <nav className={css.scroll} aria-label={ru ? "Типы тестовых данных" : "Test data types"}>
      {workspace.feature?.workspace && <ResourceBranch kind="static" label={ru ? "Статические данные" : "Static Data"} ru={ru} open={workspace.open.static}
        {...workspace.statics} selectedId={selectedId} canCreate={workspace.feature.permissions.create}
        toggle={() => workspace.toggle("static")} create={() => workspace.create("static")} select={workspace.selectStatic} retry={workspace.statics.refresh} />}
      {workspace.feature?.workspace ? <ResourceBranch kind="datasets" label={ru ? "Общие датасеты" : "Shared Datasets"} ru={ru} open={workspace.open.datasets}
        {...workspace.workspaces} canCreate={workspace.feature.permissions.create} toggle={() => workspace.toggle("datasets")} create={() => workspace.create("datasets")} select={workspace.selectDataset} retry={workspace.workspaces.refresh}
        renderResource={dataset => <DatasetNode dataset={dataset} ru={ru} selectedId={selectedId} select={workspace.selectDataset} selectSource={workspace.selectSource} selectView={workspace.selectView} />} />
        : <ResourceBranch kind="datasets" label={ru ? "Общие наборы" : "Shared Datasets"} ru={ru} open={workspace.open.datasets}
          {...workspace.datasets} selectedId={selectedId} canCreate={workspace.feature?.permissions.create} toggle={() => workspace.toggle("datasets")} create={() => workspace.create("datasets")} select={workspace.select} retry={workspace.datasets.refresh} />}
      {workspace.feature?.workspace && <ResourceBranch kind="values" label={ru ? "Наборы полей" : "Reusable field sets"} ru={ru} open={workspace.open.values}
        {...workspace.datasets} selectedId={selectedId} canCreate={workspace.feature.permissions.create}
        toggle={() => workspace.toggle("values")} create={() => workspace.create("values")} select={workspace.select} retry={workspace.datasets.refresh} />}
      <ResourceBranch kind="credentials" label={ru ? "Защищённые учётные данные" : "Secure Credentials"} ru={ru} open={workspace.open.credentials}
        {...workspace.credentials} selectedId={selectedId} canCreate={workspace.feature?.permissions.credentialCreate}
        toggle={() => workspace.toggle("credentials")} create={() => workspace.create("credentials")} select={workspace.select} retry={workspace.credentials.refresh} />
    </nav>
  </aside>;
}
