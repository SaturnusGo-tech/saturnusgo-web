import { useEffect, useState } from "react";
import type { Dataset, DatasetVersion } from "../../model/resources/resource";
import { useTestData } from "../../application/context/TestDataContext";
import { DatasetForm } from "./DatasetForm";
import { DataFeedback } from "../shared/DataFeedback";
import { DataModal as Modal } from "../shared/DataModal";
export function DatasetEditor({ current, ru, onSaved, onClose }: { current?: Dataset; ru: boolean; onSaved(value: Dataset): void; onClose(): void }) {
  const context = useTestData(), [version, setVersion] = useState<DatasetVersion | null>(null);
  const [loading, setLoading] = useState(Boolean(current)), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!current || !context) return;
    const controller = new AbortController(); setLoading(true); setError(false);
    context.port.version(current.id, current.currentVersionId, controller.signal).then(value => { if (!controller.signal.aborted) { setVersion(value); setLoading(false); } })
      .catch(() => { if (!controller.signal.aborted) { setError(true); setLoading(false); } });
    return () => controller.abort();
  }, [context, current, retry]);
  if (loading || error) return <Modal title={ru ? "Набор данных" : "Dataset"} onClose={onClose} wide>
    <DataFeedback loading={loading} error={error} ru={ru} retry={() => setRetry(value => value + 1)} /></Modal>;
  return <DatasetForm current={current} version={version ?? undefined} ru={ru} onSaved={onSaved} onClose={onClose} />;
}
