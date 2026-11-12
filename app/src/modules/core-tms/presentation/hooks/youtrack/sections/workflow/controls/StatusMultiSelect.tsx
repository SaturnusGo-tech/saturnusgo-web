import { IntegrationMultiSelect } from "../../../../../common/integration-controls/multi-select/IntegrationMultiSelect";
import { statusLabel, type YouTrackStatus } from "../../../../../../youtrack/model/youtrack-settings";

export function StatusMultiSelect({ label, hint, statuses, values, placeholder, onChange }: {
  label: string; hint?: string; statuses: readonly YouTrackStatus[]; values: readonly string[];
  placeholder: string; onChange: (values: string[]) => void;
}) {
  const available = new Set(statuses.map(status => status.id));
  return <IntegrationMultiSelect label={label} description={hint} placeholder={placeholder} isDisabled={statuses.length === 0}
    values={values.filter(value => available.has(value))} options={statuses.map(status => ({ value: status.id, label: statusLabel(status) }))}
    onValuesChange={next => onChange([...values.filter(value => !available.has(value)), ...next])}/>;
}
