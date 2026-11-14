import { Database } from "lucide-react";
import { useResourceWorkspace } from "../../application/library/useResourceWorkspace";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { StaticEditor } from "../static-library/StaticEditor";
import { StaticDetails } from "../static-library/StaticDetails";
import { DatasetWorkspace } from "../dataset-workspace/DatasetWorkspace";
import { SourceDetails } from "../source-reader/SourceDetails";
import { DataView } from "../view-reader/DataView";
import { DatasetEditor } from "../dataset/DatasetEditor";
import { CredentialEditor } from "../credential/CredentialEditor";
import { ResourceDetails } from "../resource/ResourceDetails";
import { DataFeedback } from "../shared/DataFeedback";
import { ResourceTree } from "../resource-tree/ResourceTree";
import { WorkspaceTabs } from "../workspace-tabs/WorkspaceTabs";
import css from "./library.module.css";

export function TestDataLibrary({ onOpenCase }: { onOpenCase?(id: string): void }) {
  const workspace = useResourceWorkspace(), { locale } = useTmsLocale(), ru = locale === "ru";
  const selection = workspace.selection;
  const dataset = selection?.mode === "dataset" ? selection.resource : null;
  const datasetOpen = selection?.mode === "dataset" || (selection?.mode === "create" && selection.kind === "datasets" && Boolean(workspace.feature?.workspace));
  if (!workspace.feature?.permissions.read) return <DataFeedback denied ru={ru} />;
  return <section className={css.workspace} aria-label={ru ? "Библиотека тестовых данных" : "Test data library"}>
    <ResourceTree workspace={workspace} ru={ru} />
    <main className={css.pane}>
      <WorkspaceTabs workspace={workspace} ru={ru} />
      {selection?.mode === "create" && selection.kind === "static" && <StaticEditor ru={ru} onSaved={workspace.savedStatic} onClose={workspace.close} />}
      {datasetOpen && <DatasetWorkspace dataset={dataset} ru={ru} onClose={workspace.close} onUpdated={workspace.savedDataset}
        onOpenSource={id => { const source = dataset?.sources.find(value => value.id === id); if (dataset && source) workspace.selectSource(dataset, source); }}
        onOpenView={id => { const view = dataset?.views.find(value => value.id === id); if (dataset && view) workspace.selectView(dataset, view); }} />}
      {selection?.mode === "create" && selection.kind === "datasets" && !workspace.feature.workspace && <DatasetEditor inline ru={ru} onSaved={workspace.saved} onClose={workspace.close} />}
      {selection?.mode === "create" && selection.kind === "values" && <DatasetEditor inline ru={ru} onSaved={workspace.saved} onClose={workspace.close} />}
      {selection?.mode === "create" && selection.kind === "credentials" && <CredentialEditor inline ru={ru} onSaved={workspace.saved} onClose={workspace.close} />}
      {selection?.mode === "static" && <StaticDetails key={selection.resource.id} resource={selection.resource} ru={ru} onClose={workspace.close} onUpdated={resource => resource ? workspace.savedStatic(resource) : workspace.updated()} />}
      {selection?.mode === "source" && <SourceDetails key={selection.resource.id} source={selection.resource} datasetName={selection.dataset.name} ru={ru} onClose={() => workspace.selectDataset(selection.dataset)} onUpdated={workspace.updated} />}
      {selection?.mode === "view" && <DataView key={selection.view.id} dataset={selection.dataset} view={selection.view} ru={ru} onClose={workspace.close} onBack={() => workspace.selectDataset(selection.dataset)} onUpdated={workspace.savedDataset} />}
      {selection?.mode === "read" && <ResourceDetails key={selection.resource.id} inline resource={selection.resource}
        ru={ru} onClose={workspace.close} onUpdated={workspace.updated} onOpenCase={onOpenCase} />}
      {!selection && <div className={css.empty}>
        <Database size={36} strokeWidth={1.1} aria-hidden="true" />
        <h2>{ru ? "Тестовые данные проекта" : "Your project’s test data"}</h2>
        <p>{ru ? "Откройте ресурс слева или создайте новые тестовые данные." : "Open a resource from the sidebar or create new test data."}</p>
      </div>}
    </main>
  </section>;
}
