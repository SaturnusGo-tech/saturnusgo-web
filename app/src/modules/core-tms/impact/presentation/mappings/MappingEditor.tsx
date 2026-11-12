import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import type { RepositoryInput } from "../../model/impact-types";
import css from "../styles/impact.module.css";
import { IntegrationInput } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { IntegrationTextarea } from "../../../presentation/common/integration-controls/textarea/IntegrationTextarea";
import { IntegrationCheckbox } from "../../../presentation/common/integration-controls/checkbox/IntegrationCheckbox";
const values = (text: string) => text.split("\n");
export function MappingEditor({ mappings, platform, ru, onChange }: {
  mappings: RepositoryInput["mappings"]; platform: RepositoryInput["platform"]; ru: boolean;
  onChange: (value: RepositoryInput["mappings"]) => void;
}) {
  const change = (index: number, patch: Partial<RepositoryInput["mappings"][number]>) =>
    onChange(mappings.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <section className={css.root}><div className={css.heading}><div><h3>{ru ? "Области покрытия" : "Coverage mappings"}</h3>
    <p>{ru ? "Свяжите пути кода с компонентами, тегами и папками тестов. Значения — по одному на строку." : "Connect code paths to test components, tags, and folders. Enter one value per line."}</p></div>
    <IntegrationButton type="button" onPress={() => onChange([...mappings, { id: crypto.randomUUID(), area: "", platforms: [platform], pathPrefixes: [], components: [], tags: [], folderPrefixes: [], endpoints: [] }])}>{ru ? "Добавить область" : "Add area"}</IntegrationButton></div>
    {mappings.map((mapping, index) => <div className={css.row} key={mapping.id}>
      <IntegrationInput label={ru ? "Название области" : "Area name"} isRequired maxLength={200} value={mapping.area} onValueChange={(area) => change(index, { area })} />
      <div className={css.grid}>{([
        ["pathPrefixes", ru ? "Префиксы путей кода" : "Code path prefixes"], ["components", ru ? "Компоненты тестов" : "Test components"],
        ["tags", ru ? "Теги тестов" : "Test tags"], ["folderPrefixes", ru ? "Папки тестов" : "Test folder prefixes"],
        ["endpoints", ru ? "API endpoints" : "API endpoints"],
      ] as const).map(([key, label]) => <IntegrationTextarea label={label} key={key} value={mapping[key].join("\n")}
        onValueChange={(value) => change(index, { [key]: values(value) })} />)}</div>
      <div className={css.actions}>{(["backend", "ios", "android", "api", "web", "shared"] as const).map((value) => <IntegrationCheckbox className={css.check} key={value} isSelected={mapping.platforms.includes(value)}
        onValueChange={(selected) => change(index, { platforms: selected ? [...mapping.platforms, value] : mapping.platforms.filter((item) => item !== value) })}>{value}</IntegrationCheckbox>)}</div>
      <IntegrationButton type="button" onPress={() => onChange(mappings.filter((_, i) => i !== index))}>{ru ? "Удалить область" : "Remove area"}</IntegrationButton>
    </div>)}
  </section>;
}
