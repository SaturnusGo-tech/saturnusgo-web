import { useState } from "react";
import { MAX_CASE_BULK_MUTATION_ITEMS } from "../../../../../../core/tms/contracts/test-cases/bulk-case-contract";
import { CaseBulkActionBar } from "../../bulk/action/CaseBulkActionBar";
import { MoveCasesDialog } from "../../../../folders/presentation/dialog/MoveCasesDialog";
import { ArchiveCasesDialog } from "../../../../folders/presentation/dialog/ArchiveCasesDialog";
import type { CasesViewProps } from "../../types";
import type { useCasesViewController } from "../../view/useCasesViewController";
import type { TmsLocale } from "../../../../localization/model/locale";

export function CasesSelectionActions({ props, view, locale }: {
  props: CasesViewProps; view: ReturnType<typeof useCasesViewController>; locale: TmsLocale;
}) {
  const [action, setAction] = useState<"move" | "archive" | null>(null);
  const [error, setError] = useState("");
  async function removeFromFolder() {
    const result = await props.folders?.moveCases(view.bulkSelection.selectedIds, null);
    if (result?.ok) view.bulkSelection.clear(); else if (result) setError(result.message);
  }
  return <>
      {view.bulkSelection.selectedIds.length > 0 && !props.editor && <CaseBulkActionBar
        locale={locale}
        selectedCount={view.bulkSelection.selectedIds.length}
        onMove={props.folders?.canManage ? () => setAction("move") : undefined}
        onRemove={props.folders?.canManage ? () => void removeFromFolder() : undefined}
        onArchive={props.folders?.canManage ? () => setAction("archive") : undefined}
        externalBusy={props.folders?.busy}
        mutationLimit={MAX_CASE_BULK_MUTATION_ITEMS}
        mutationEnabled={props.bulkMutationEnabled}
        onClear={view.bulkSelection.clear}
        onCreateRun={() => props.onRunCases(view.bulkSelection.selectedIds)}
        onChangeLifecycle={(value) => props.onBulkChangeLifecycle(view.bulkSelection.selectedIds, value)}
        onChangePriority={(value) => props.onBulkChangePriority(view.bulkSelection.selectedIds, value)}
      />}
    {error && <p role="alert">{error}</p>}
    {props.folders && action === "move" && <MoveCasesDialog resource={props.folders} ids={view.bulkSelection.selectedIds} ru={locale === "ru"}
      onClose={() => setAction(null)} onMoved={view.bulkSelection.clear} />}
    {props.folders && action === "archive" && <ArchiveCasesDialog resource={props.folders} ids={view.bulkSelection.selectedIds} ru={locale === "ru"}
      onClose={() => setAction(null)} onArchived={view.bulkSelection.clear} />}
  </>;
}
