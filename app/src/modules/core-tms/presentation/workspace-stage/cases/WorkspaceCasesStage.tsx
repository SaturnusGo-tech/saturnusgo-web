import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { CasesView } from "../../cases/CasesView";

export function WorkspaceCasesStage({ model }: { model: WorkspaceModel }) {
  return <CasesView key={model.project!.id}
    query={model.query}
    onQuery={model.setQuery}
    testCases={model.projectCases}
    groups={model.folderGroups}
    selectedFolder={model.selectedFolder}
    onSelectFolder={model.selectFolder}
    selectedCaseId={model.selectedCase?.id ?? ""}
    onSelectCase={(id) => {
      model.setSelectedCaseId(id);
      model.setEditing(false);
    }}
    testCase={model.selectedCase}
    revision={model.selectedRevision}
    linkIds={model.selectedCaseDetail?.linkIds ?? []}
    onNew={model.openNewCase}
    onEdit={model.openEditCase}
    onClone={model.cloneCase}
    onArchive={model.toggleArchiveCase}
    onRunCase={() => model.selectedCase
      && model.openRunDialog({ caseIds: [model.selectedCase.id] })}
    onRunCases={(caseIds) => model.openRunDialog({ caseIds })}
    onBulkChangeLifecycle={model.bulkChangeCaseLifecycle}
    onBulkChangePriority={model.bulkChangeCasePriority}
    bulkMutationEnabled={model.connection === "connected"}
    activity={model.data.activity}
    collaboration={model.caseCollaboration}
    onOpenDefect={model.openDefect}
    filters={model.caseFilters}
    onFilters={model.setCaseFilters}
    onNewFolder={() => model.setDialog("folder")}
    detailLoadError={model.selectedCaseDetailError}
    onRetryDetail={model.retrySelectedCaseDetail}
    sharedSteps={model.sharedSteps.items}
    onResolveSharedStep={model.sharedSteps.resolve}
    editor={model.dialog === "case" ? {
      mode: model.editing ? "edit" : "create",
      value: model.caseDraft,
      folderPath: model.caseFolderPath,
      folders: model.folderGroups.map(([folderName]) => folderName),
      components: Array.from(new Set(
        model.projectCases.map((testCase) => testCase.component).filter(Boolean),
      )).sort(),
      onChange: model.setCaseDraft,
      onFolderPath: model.setCaseFolderPath,
      onSubmit: model.saveCase,
      submitting: model.caseSubmitting,
      onCancel: () => {
        if (!model.caseSubmitting) model.resetCaseEditor(model.selectedFolder);
      },
    } : undefined}
  />;
}
