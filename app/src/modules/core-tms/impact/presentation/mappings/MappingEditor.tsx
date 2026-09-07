import type { RepositoryInput } from "../../model/impact-types";
import css from "../styles/impact.module.css";
const values = (text: string) => text.split("\n");
export function MappingEditor({ mappings, platform, ru, onChange }: {
  mappings: RepositoryInput["mappings"]; platform: RepositoryInput["platform"]; ru: boolean;
  onChange: (value: RepositoryInput["mappings"]) => void;
}) {
  const change = (index: number, patch: Partial<RepositoryInput["mappings"][number]>) =>
    onChange(mappings.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <section className={css.root}><div className={css.heading}><div><h3>{ru ? "Области покрытия" : "Coverage mappings"}</h3>
    <p>{ru ? "Свяжите пути кода с компонентами, тегами и папками тестов. Значения — по одному на строку." : "Connect code paths to test components, tags, and folders. Enter one value per line."}</p></div>
    <button type="button" onClick={() => onChange([...mappings, { id: crypto.randomUUID(), area: "", platforms: [platform], pathPrefixes: [], components: [], tags: [], folderPrefixes: [], endpoints: [] }])}>{ru ? "Добавить область" : "Add area"}</button></div>
    {mappings.map((mapping, index) => <div className={css.row} key={mapping.id}>
      <label className={css.field}>{ru ? "Название области" : "Area name"}<input required maxLength={200} value={mapping.area} onChange={(event) => change(index, { area: event.target.value })} /></label>
      <div className={css.grid}>{([
        ["pathPrefixes", ru ? "Префиксы путей кода" : "Code path prefixes"], ["components", ru ? "Компоненты тестов" : "Test components"],
        ["tags", ru ? "Теги тестов" : "Test tags"], ["folderPrefixes", ru ? "Папки тестов" : "Test folder prefixes"],
        ["endpoints", ru ? "API endpoints" : "API endpoints"],
      ] as const).map(([key, label]) => <label className={css.field} key={key}>{label}<textarea value={mapping[key].join("\n")}
        onChange={(event) => change(index, { [key]: values(event.target.value) })} /></label>)}</div>
      <div className={css.actions}>{(["backend", "ios", "android", "api", "web", "shared"] as const).map((value) => <label className={css.check} key={value}><input type="checkbox" checked={mapping.platforms.includes(value)}
        onChange={(event) => change(index, { platforms: event.target.checked ? [...mapping.platforms, value] : mapping.platforms.filter((item) => item !== value) })} />{value}</label>)}</div>
      <button type="button" onClick={() => onChange(mappings.filter((_, i) => i !== index))}>{ru ? "Удалить область" : "Remove area"}</button>
    </div>)}
  </section>;
}
