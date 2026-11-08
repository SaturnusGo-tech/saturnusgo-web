import { PortfolioRepository } from "../../../repository-scope/presentation/browser/PortfolioRepository";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { FolderStructurePage } from "../../../folders/presentation/structure/FolderStructurePage";
import { useFolderStructureScreen } from "../../../folders/state/structure/useFolderStructureScreen";
import { CasesView } from "../../cases/CasesView";

export function WorkspaceCasesStage({ model }: { model: WorkspaceModel }) {
  const { locale } = useTmsLocale();
  const structure = useFolderStructureScreen();
  if (structure.open && !model.repositoryScope.aggregate) return <FolderStructurePage key={`${model.data.workspace.id}:${model.project?.id}`} resource={model.folders} ru={locale === "ru"} onBack={structure.close} focusFolderId={structure.focusFolderId} onFocusHandled={structure.clearFocus} />;
  const selectionAllowed = !model.repositoryScope.aggregate || model.portfolioRepository.catalog?.projects.some(project => project.id === model.selectedCase?.projectId);
  const capabilities = model.data.meta.authorization.capabilities;
  return <CasesView key={model.repositoryScope.aggregate ? model.repositoryScope.key : model.project?.id}
    repository={model.repositoryScope.aggregate ? <PortfolioRepository key={model.repositoryScope.key} model={model} /> : undefined}
    projectName={model.repositoryScope.aggregate
      ? model.portfolioRepository.catalog?.projects.find((project) => project.id === model.selectedCase?.projectId)?.name
      : model.project?.name}
    folders={model.folders}
    onImport={() => model.setView("imports")}
    query={model.query}
    onQuery={model.setQuery}
    testCases={model.projectCases}
    groups={model.folderGroups}
    selectedFolder={model.selectedFolder}
    selectedFolderId={model.selectedFolderId}
    onSelectFolder={model.selectFolder}
    selectedCaseId={selectionAllowed ? model.selectedCase?.id ?? "" : ""}
    onSelectCase={(id) => {
      model.setSelectedCaseId(id);
      model.setEditing(false);
    }}
    testCase={selectionAllowed ? model.selectedCase : undefined}
    revision={model.selectedRevision}
    linkIds={model.selectedCaseDetail?.linkIds ?? []}
    canAttach={model.connection === "connected" && capabilities.includes("test_case:manage") && capabilities.includes("attachment:manage")}
    onNew={model.openNewCase}
    onEdit={model.openEditCase}
    onClone={model.cloneCase}
    onCreateDefect={model.canCreateDefect ? model.openCaseDefect : undefined}
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
    onNewFolder={() => structure.show()}
    onManageFolder={structure.show}
    detailLoadError={model.selectedCaseDetailError}
    onRetryDetail={model.retrySelectedCaseDetail}
    sharedSteps={model.sharedSteps.items}
    onResolveSharedStep={model.sharedSteps.resolve}
    editor={model.dialog === "case" ? {
      projectId: model.editing ? model.selectedCase?.projectId ?? model.project?.id : model.project?.id,
      requiredFields: model.caseRequiredFields,
      canCreateFieldValues: model.data.meta.authorization.capabilities.includes("test_case:manage"),
      mode: model.editing ? "edit" : "create",
      value: model.caseDraft,
      folderPath: model.caseFolderPath,
      folders: model.folders.items.filter((folder) => !folder.archivedAt).map((folder) => folder.path),
      components: Array.from(new Set(
        model.projectCases.map((testCase) => testCase.component).filter(Boolean),
      )).sort(),
      onChange: model.setCaseDraft,
      onFolderPath: model.setCaseFolderPath,
      onSubmit: model.saveCase,
      submitting: model.caseSubmitting,
      attachmentsPending: model.caseAttachmentRecovery,
      documentationRetry: model.caseDocumentationRetry,
      documentation: !model.editing && model.connection === "connected" ? {
        value: model.caseDocumentation, onChange: model.setCaseDocumentation, retry: model.caseDocumentationRetry,
      } : undefined,
      onCancel: () => {
        if (!model.caseSubmitting) model.resetCaseEditor(model.selectedFolder);
      },
    } : undefined}
  />;
}
