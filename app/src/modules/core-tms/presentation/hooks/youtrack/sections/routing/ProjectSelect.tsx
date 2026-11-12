import { IntegrationSelect } from "../../../../common/integration-controls/select/IntegrationSelect";
import type { HooksCopy } from "../../../shared/hooks-copy";
import type { YouTrackProject } from "../../../../../youtrack/model/youtrack-settings";

export function ProjectSelect({ value, projects, copy, label, loading, disabled = false, onChange }: {
  value: string; projects: readonly YouTrackProject[]; copy: HooksCopy; label: string;
  loading: boolean; disabled?: boolean; onChange: (value: string) => void;
}) {
  return <IntegrationSelect label={label} value={value} isDisabled={disabled || projects.length === 0 || loading}
    placeholder={loading ? copy.loadingProject : copy.chooseProject}
    options={projects.map(project => ({ value: project.id, label: project.name, description: project.shortName }))}
    onValueChange={onChange}/>;
}
