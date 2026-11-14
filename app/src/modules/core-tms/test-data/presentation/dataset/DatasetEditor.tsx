import { useEffect, useState } from "react";
import type { Dataset, DatasetVersion } from "../../model/resources/resource";
import { useTestData } from "../../application/context/TestDataContext";
import { DatasetForm } from "./DatasetForm";
import { DataFeedback } from "../shared/DataFeedback";
import { ResourceEditorFrame } from "../editor-frame/ResourceEditorFrame";
import frame from "../editor-frame/resource-editor.module.css";
export function DatasetEditor({ current, ru, onSaved, onClose, inline = false }: { current?: Dataset; ru: boolean; onSaved(value: Dataset): void; onClose(): void; inline?: boolean }) {
  const context = useTestData(), [version, setVersion] = useState<DatasetVersion | null>(null);
  const [loading, setLoading] = useState(Boolean(current)), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!current || !context) return;
    const controller = new AbortController(); setLoading(true); setError(false);
    context.port.version(current.id, current.currentVersionId, controller.signal).then(value => { if (!controller.signal.aborted) { setVersion(value); setLoading(false); } })
      .catch(() => { if (!controller.signal.aborted) { setError(true); setLoading(false); } });
    return () => controller.abort();
  }, [context, current, retry]);
  if (loading || error) return <ResourceEditorFrame inline={inline} title={ru ? "Набор данных" : "Dataset"} onClose={onClose} ru={ru}>
    <div className={inline ? frame.feedback : undefined}><DataFeedback loading={loading} error={error} ru={ru} retry={() => setRetry(value => value + 1)} /></div></ResourceEditorFrame>;
  return <DatasetForm current={current} version={version ?? undefined} ru={ru} onSaved={onSaved} onClose={onClose} inline={inline} />;
}
