import { useEffect, useState } from "react";
import type { TestDataBinding } from "../../model/bindings/binding";
import type { Credential, Dataset } from "../../model/resources/resource";
import { useTestData } from "../../application/context/TestDataContext";
import { DataModal as Modal } from "../shared/DataModal";
import { DataFeedback } from "../shared/DataFeedback";
import { ResourceDetails } from "./ResourceDetails";
export function BindingSourceDetails({ binding, ru, onClose }: { binding: Exclude<TestDataBinding, { sourceType: "STATIC" }>; ru: boolean; onClose(): void }) {
  const feature = useTestData(), [value, setValue] = useState<Dataset | Credential | null>(null), [error, setError] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!feature) return;
    const controller = new AbortController(); setValue(null); setError(false);
    const load = binding.sourceType === "DATASET" ? feature.port.dataset(binding.sourceId, controller.signal) : feature.port.credential(binding.sourceId, controller.signal);
    void load.then(resource => { if (!controller.signal.aborted) setValue(resource); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [feature, binding, retry]);
  return value ? <ResourceDetails resource={value} ru={ru} onClose={onClose} onUpdated={() => setRetry(value => value + 1)} />
    : <Modal title={ru ? "Источник тестовых данных" : "Test data source"} onClose={onClose}><DataFeedback loading={!error} error={error} ru={ru} retry={() => setRetry(value => value + 1)} /></Modal>;
}
