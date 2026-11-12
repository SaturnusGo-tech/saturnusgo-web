import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { Plus, Trash2, GitPullRequest, ArrowRight } from "lucide-react";
import type { Catalog, RunRule } from "../../model/connector-types";
import { eventLabel } from "../../localization/connector-copy";
import styles from "../styles/connector.module.css";
import { IntegrationInput } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import { IntegrationSelect } from "../../../presentation/common/integration-controls/select/IntegrationSelect";
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
        <IntegrationButton type="button" aria-label={ru ? "Удалить правило" : "Remove rule"} onPress={() => onChange(rules.filter((_, i) => i !== index))}><Trash2 size={15} /></IntegrationButton></div>
      <div className={styles.fields}>
        <IntegrationInput label={ru ? "Название правила" : "Rule name"} value={rule.id} pattern="[a-z0-9][a-z0-9_-]{0,31}" maxLength={32}
          onValueChange={(id) => change(index, { id })} />
        <IntegrationSelect label={ru ? "Событие" : "Event"} value={rule.event} onValueChange={(event) => change(index, { event: event as RunRule["event"] })}
          options={(["pull_request", "push", "release", "workflow_failed"] as const).map(value => ({ value, label: eventLabel(value, ru) }))} />
        <IntegrationSelect label={ru ? "Набор тестов" : "Test suite"} value={rule.suiteId} placeholder={ru ? "Выберите набор" : "Select a suite"}
          onValueChange={(suiteId) => change(index, { suiteId })} options={catalog.suites.map(s => ({ value: s.id, label: s.name }))} />
        <IntegrationSelect label={ru ? "Окружение" : "Environment"} value={rule.environmentId} placeholder={ru ? "Выберите окружение" : "Select an environment"}
          onValueChange={(environmentId) => change(index, { environmentId })} options={catalog.environments.map(s => ({ value: s.id, label: s.name }))} />
        <IntegrationInput label={ru ? "Ветки через запятую" : "Branches, comma-separated"} value={rule.branches.join(",")} onValueChange={(value) => change(index, { branches: value.split(",") })}
          placeholder={ru ? "Пусто — любые ветки" : "Empty means all branches"} onBlur={(e) => change(index, { branches: list(e.target.value) })} />
        <IntegrationInput label={ru ? "Префиксы изменённых путей" : "Changed path prefixes"} value={rule.pathPrefixes.join(",")} onValueChange={(value) => change(index, { pathPrefixes: value.split(",") })}
          placeholder="src/payments/, app/checkout/" onBlur={(e) => change(index, { pathPrefixes: list(e.target.value) })} />
      </div>
      <small>{ru ? "Фильтр путей применяется к PR и push. Для релиза или падения Actions оставьте его пустым." : "Path filters apply to PR and push events. Leave empty for releases or failed Actions."}</small>
    </div>)}</div>
    <IntegrationButton type="button" className={styles.secondary} isDisabled={rules.length >= 20} onPress={() => onChange([...rules, {
      id: `qa-${crypto.randomUUID().slice(0, 8)}`, event: "pull_request", suiteId: "", environmentId: "", branches: [], pathPrefixes: [],
    }])}><Plus size={16} />{ru ? "Добавить правило" : "Add rule"}</IntegrationButton>
  </section>;
}
