import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { ExecutionStatus, RunItem, RunItemSummary, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { executableSteps } from "../../../helpers/cases/caseRevision";

type RunKeyboardShortcutOptions = {
  items: RunItemSummary[];
  selectedItem: RunItem | null;
  selectedRun: TestRunSummary | null;
  runWritable: boolean;
  onItemStatus: (status: ExecutionStatus) => void;
  onSelectItem: (id: string) => void;
  setReporting: Dispatch<SetStateAction<boolean>>;
};

export function useRunKeyboardShortcuts(options: RunKeyboardShortcutOptions) {
  const { items, onItemStatus, onSelectItem, runWritable, selectedItem, selectedRun, setReporting } = options;
  useEffect(() => {
    if (!selectedRun || !selectedItem) return;
    const item = selectedItem;
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const index = items.findIndex((entry) => entry.id === item.id);
      const activeAttempt = item.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo)
        ?? item.attempts[0];
      const requiredPassed = executableSteps(item.snapshot).filter((step) => step.required)
        .every((step) => activeAttempt.stepResults.find((result) => result.stepId === step.id)?.status === "passed");
      const hasProcedure = executableSteps(item.snapshot).length > 0;
      const hasFailure = item.status === "failed"
        || activeAttempt.stepResults.some((result) => result.status === "failed");
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && event.key === "[") {
        event.preventDefault();
        const previous = items[index - 1];
        if (previous) onSelectItem(previous.id);
      } else if ((event.metaKey || event.ctrlKey) && event.key === "]") {
        event.preventDefault();
        const next = items[index + 1];
        if (next) onSelectItem(next.id);
      } else if (key === "b" && runWritable) {
        event.preventDefault(); onItemStatus("blocked");
      } else if (key === "f" && runWritable) {
        event.preventDefault(); onItemStatus("failed");
      } else if (key === "p" && runWritable && requiredPassed) {
        event.preventDefault(); onItemStatus("passed");
      } else if (key === "e" && runWritable) {
        event.preventDefault(); document.getElementById(`run-evidence-${item.id}`)?.click();
      } else if (key === "r" && runWritable && hasFailure && hasProcedure) {
        event.preventDefault(); setReporting(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [items, onItemStatus, onSelectItem, runWritable, selectedItem, selectedRun, setReporting]);
}
