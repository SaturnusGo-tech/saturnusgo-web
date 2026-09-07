import { Plus, Trash2, GitPullRequest, ArrowRight } from "lucide-react";
import type { Catalog, RunRule } from "../../model/connector-types";
import { eventLabel } from "../../localization/connector-copy";
import styles from "../styles/connector.module.css";
export function RunRules({ rules, catalog, ru, onChange }: {
  rules: RunRule[]; catalog: Catalog; ru: boolean; onChange: (rules: RunRule[]) => void;
}) {
  const change = (index: number, patch: Partial<RunRule>) => onChange(rules.map((r, i) => i === index ? { ...r, ...patch } : r));
  const list = (value: string) => value.split(",").map((part) => part.trim()).filter(Boolean);
  return <section className={styles.panel}>
    <header><GitPullRequest size={20} /><h2>{ru ? "Правила тестирования" : "Testing rules"}</h2></header>
    <p>{ru ? "Каждое совпавшее правило создаёт прогон выбранного набора. В прогон сохраняются версии кейсов, сборка и источник изменения." :
      "Each matching rule creates a run from the selected suite, preserving case revisions, build and change source."}</p>
    {rules.length === 0 && <div className={styles.empty}>{ru ? "Добавьте первое правило, чтобы выбрать нужные тесты." : "Add your first rule to select the right tests."}</div>}
    <div className={styles.ruleList}>{rules.map((rule, index) => <div className={styles.rule} key={index}>
      <div className={styles.ruleTitle}><code>{rule.id || (ru ? "Новое правило" : "New rule")}</code><ArrowRight size={14} /><span>Falcon test run</span>
        <button type="button" aria-label={ru ? "Удалить правило" : "Remove rule"} onClick={() => onChange(rules.filter((_, i) => i !== index))}><Trash2 size={15} /></button></div>
      <div className={styles.fields}>
        <label>{ru ? "Название правила" : "Rule name"}<input value={rule.id} pattern="[a-z0-9][a-z0-9_-]{0,31}" maxLength={32}
          onChange={(e) => change(index, { id: e.target.value })} /></label>
        <label>{ru ? "Событие" : "Event"}<select value={rule.event} onChange={(e) => change(index, { event: e.target.value as RunRule["event"] })}>
          {(["pull_request", "push", "release", "workflow_failed"] as const).map((value) => <option key={value} value={value}>{eventLabel(value, ru)}</option>)}</select></label>
        <label>{ru ? "Набор тестов" : "Test suite"}<select value={rule.suiteId} onChange={(e) => change(index, { suiteId: e.target.value })}>
          <option value="">{ru ? "Выберите набор" : "Select a suite"}</option>
          {catalog.suites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>{ru ? "Окружение" : "Environment"}<select value={rule.environmentId} onChange={(e) => change(index, { environmentId: e.target.value })}>
          <option value="">{ru ? "Выберите окружение" : "Select an environment"}</option>
          {catalog.environments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>{ru ? "Ветки через запятую" : "Branches, comma-separated"}<input value={rule.branches.join(",")} onChange={(e) => change(index, { branches: e.target.value.split(",") })}
          placeholder={ru ? "Пусто — любые ветки" : "Empty means all branches"} onBlur={(e) => change(index, { branches: list(e.target.value) })} /></label>
        <label>{ru ? "Префиксы изменённых путей" : "Changed path prefixes"}<input value={rule.pathPrefixes.join(",")} onChange={(e) => change(index, { pathPrefixes: e.target.value.split(",") })}
          placeholder="src/payments/, app/checkout/" onBlur={(e) => change(index, { pathPrefixes: list(e.target.value) })} /></label>
      </div>
      <small>{ru ? "Фильтр путей применяется к PR и push. Для релиза или падения Actions оставьте его пустым." : "Path filters apply to PR and push events. Leave empty for releases or failed Actions."}</small>
    </div>)}</div>
    <button type="button" className={styles.secondary} disabled={rules.length >= 20} onClick={() => onChange([...rules, {
      id: `qa-${crypto.randomUUID().slice(0, 8)}`, event: "pull_request", suiteId: "", environmentId: "", branches: [], pathPrefixes: [],
    }])}><Plus size={16} />{ru ? "Добавить правило" : "Add rule"}</button>
  </section>;
}
