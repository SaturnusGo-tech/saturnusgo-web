import { useState } from "react";
import type { Catalog } from "../../../connectors/model/connector-types";
import type { ImpactRepository, RepositoryInput } from "../../model/impact-types";
import { MappingEditor } from "../mappings/MappingEditor";
import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { IntegrationInput } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { IntegrationTextarea } from "../../../presentation/common/integration-controls/textarea/IntegrationTextarea";
import { IntegrationSelect } from "../../../presentation/common/integration-controls/select/IntegrationSelect";
import { IntegrationSwitch } from "../../../presentation/common/integration-controls/switch/IntegrationSwitch";
import { IntegrationControlScope } from "../../../presentation/common/integration-controls/scope/IntegrationControlScope";
import css from "../styles/impact.module.css";
const lines = (value: string) => value.split("\n");
const normalize = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];
export function RepositoryForm({ row, connectionId, catalog, ru, pending, onSave, onCancel }: {
  row?: ImpactRepository; connectionId: string; catalog: Catalog; ru: boolean; pending: boolean;
  onSave: (input: RepositoryInput) => Promise<void>; onCancel: () => void;
}) {
  const [draft, setDraft] = useState<RepositoryInput>(() => row ? {
    connectionId: row.connectionId, repository: row.repository, platform: row.platform, enabled: row.enabled,
    environmentId: row.environmentId, branches: row.branches, workflows: row.workflows, mappings: row.mappings, sensitivePaths: row.sensitivePaths,
  } : { connectionId, repository: "", platform: "backend", enabled: false, environmentId: "", branches: ["main"], workflows: [], mappings: [], sensitivePaths: [] });
  const field = <K extends keyof RepositoryInput>(key: K, value: RepositoryInput[K]) => setDraft((old) => ({ ...old, [key]: value }));
  return <form className={css.row} onSubmit={(event) => { event.preventDefault(); void onSave({ ...draft,
    repository: draft.repository.trim(), branches: normalize(draft.branches), workflows: normalize(draft.workflows), sensitivePaths: normalize(draft.sensitivePaths),
    mappings: draft.mappings.map((mapping) => ({ ...mapping, area: mapping.area.trim(), pathPrefixes: normalize(mapping.pathPrefixes),
      components: normalize(mapping.components), tags: normalize(mapping.tags), folderPrefixes: normalize(mapping.folderPrefixes), endpoints: normalize(mapping.endpoints) })),
  }); }} style={{ marginTop: 16 }}>
    <IntegrationControlScope disabled={pending}><fieldset disabled={pending}><legend>{row ? (ru ? "Настройки репозитория" : "Repository settings") : (ru ? "Новый репозиторий" : "New repository")}</legend>
      <div className={css.grid}><IntegrationInput label="GitHub owner/repository" isRequired maxLength={255} pattern="[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+" value={draft.repository} onValueChange={(value) => field("repository", value)} />
        <IntegrationSelect label={ru ? "Платформа" : "Platform"} value={draft.platform} onValueChange={(value) => field("platform", value as RepositoryInput["platform"])}
          options={["backend", "ios", "android", "api", "web", "shared"].map(value => ({ value, label: value }))} />
        <IntegrationSelect label={ru ? "Окружение тест-рана" : "Test run environment"} isRequired value={draft.environmentId} onValueChange={(value) => field("environmentId", value)}
          placeholder={ru ? "Выберите окружение" : "Select environment"} options={catalog.environments.map(env => ({ value: env.id, label: env.name }))} />
        <IntegrationTextarea label={ru ? "Ветки: по одной на строку" : "Branches: one per line"} value={draft.branches.join("\n")} onValueChange={(value) => field("branches", lines(value))} />
        <IntegrationTextarea label={ru ? "GitHub Actions workflows: по одному на строку" : "GitHub Actions workflows: one per line"} value={draft.workflows.join("\n")} onValueChange={(value) => field("workflows", lines(value))} />
        <IntegrationTextarea label={ru ? "Чувствительные пути: по одному префиксу на строку" : "Sensitive paths: one prefix per line"} value={draft.sensitivePaths.join("\n")} onValueChange={(value) => field("sensitivePaths", lines(value))} /></div>
      <MappingEditor mappings={draft.mappings} platform={draft.platform} ru={ru} onChange={(value) => field("mappings", value)} />
      <IntegrationSwitch isSelected={draft.enabled} onValueChange={(value) => field("enabled", value)}>{ru ? "Включить анализ событий этого репозитория" : "Enable analysis of this repository's events"}</IntegrationSwitch>
      <div className={css.actions}><IntegrationButton className={css.primary} type="submit">{ru ? "Проверить доступ и сохранить" : "Verify access and save"}</IntegrationButton><IntegrationButton type="button" onPress={onCancel}>{ru ? "Отмена" : "Cancel"}</IntegrationButton></div>
    </fieldset></IntegrationControlScope>
  </form>;
}
