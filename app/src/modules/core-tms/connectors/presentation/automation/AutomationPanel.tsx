import { ArrowRight, Bell, Workflow } from "lucide-react";
import type { Provider, ConnectionInput, Discovery, Catalog } from "../../model/connector-types";
import { eventOptions } from "../../model/connector-draft";
import { eventLabel, statusLabel } from "../../localization/connector-copy";
import { RunRules } from "./RunRules";
import styles from "../styles/connector.module.css";
import { IntegrationCheckbox } from "../../../presentation/common/integration-controls/checkbox/IntegrationCheckbox";
import { IntegrationSelect } from "../../../presentation/common/integration-controls/select/IntegrationSelect";
export function AutomationPanel({ provider, ru, draft, discovery, catalog, onChange }: {
  provider: Provider; ru: boolean; draft: ConnectionInput; discovery: Discovery | null;
  catalog: Catalog; onChange: (value: ConnectionInput) => void;
}) {
  const settings = draft.settings; const tracker = ["jira", "linear", "trello"].includes(provider);
  const update = (patch: Partial<ConnectionInput["settings"]>) => onChange({ ...draft, settings: { ...settings, ...patch } });
  const statusOptions = discovery?.statuses ?? [...new Set([...settings.inboundReadyStatuses, ...Object.values(settings.outboundStatuses)])]
    .filter((id): id is string => Boolean(id)).map((id) => ({ id, name: id }));
  return <div className={styles.automationGrid}>
    <section className={styles.panel}>
      <header><Bell size={20} /><h2>{ru ? "События" : "Events"}</h2></header>
      <p>{ru ? "Выберите события этого проекта, которые должна обрабатывать интеграция." : "Choose which events from this project the integration should process."}</p>
      <div className={styles.checkList}>{eventOptions[provider].map((event) => <IntegrationCheckbox className={styles.check} key={event}
        isSelected={settings.events.includes(event)} onValueChange={(selected) => update({
          events: selected ? [...settings.events, event] : settings.events.filter((v) => v !== event),
        })}><span>{eventLabel(event, ru)}<small>{event}</small></span></IntegrationCheckbox>)}</div>
    </section>
    {tracker && <section className={styles.panel}>
      <header><Workflow size={20} /><h2>{ru ? "Движение исправления" : "Fix workflow"}</h2></header>
      <div className={styles.workflow}><span>Falcon</span><ArrowRight size={15} /><span>{provider}</span><ArrowRight size={15} /><span>{ru ? "Ретест" : "Retest"}</span></div>
      <p>{ru ? "Статусы сервиса ниже возвращают дефект в Falcon в состояние «Готов к ретесту». Они не отмечают тест пройденным." :
        "These service statuses return a defect to Falcon as Ready for retest. They never mark a test as passed."}</p>
      {statusOptions.length === 0 && <div className={styles.empty}>{ru ? "Сначала проверьте доступ на вкладке подключения, чтобы загрузить статусы." : "Verify access on the Connection tab to load statuses."}</div>}
      <div className={styles.statusChoices}>{statusOptions.map((option) => <IntegrationCheckbox className={styles.check} key={option.id}
        isSelected={settings.inboundReadyStatuses.includes(option.id)} onValueChange={(selected) => update({
          inboundReadyStatuses: selected ? [...settings.inboundReadyStatuses, option.id] : settings.inboundReadyStatuses.filter((id) => id !== option.id),
        })}>{option.name}</IntegrationCheckbox>)}</div>
      <h3>{ru ? "Обновление статуса в сервисе" : "Update the service status"}</h3>
      <div className={styles.mapping}>{(["open", "triaged", "in_progress", "ready_for_retest", "verified", "closed", "reopened"] as const).map((status) =>
        <div key={status}><span>{statusLabel(status, ru)}</span><ArrowRight size={13} />
          <IntegrationSelect aria-label={`${statusLabel(status, ru)} → ${provider}`} value={settings.outboundStatuses[status] ?? ""} onValueChange={(value) => {
            const mapped = { ...settings.outboundStatuses }; if (value) mapped[status] = value; else delete mapped[status];
            update({ outboundStatuses: mapped });
          }} options={[{ value: "", label: ru ? "Не менять" : "Keep unchanged" }, ...statusOptions.map(o => ({ value: o.id, label: o.name }))]} /></div>)}</div>
    </section>}
    {provider === "github" && <RunRules ru={ru} catalog={catalog} rules={settings.rules} onChange={(rules) => update({ rules })} />}
    {provider === "slack" && <section className={styles.panel}><header><h2>{ru ? "Что увидит команда" : "What the team receives"}</h2></header>
      <div className={styles.slackMessage}><span className={styles.botAvatar}>F</span><div><strong>Falcon <small>APP</small></strong>
        <h3>{ru ? "Событие и результат" : "Event and outcome"}</h3><p>{ru ? "Название прогона, дефекта или события GitHub, доступные результаты и контекст сборки." : "Run, defect or GitHub event title, available results and build context."}</p>
        <span className={styles.messageLink}>{ru ? "Ссылка на прогон, дефект или исходное событие ↗" : "Link to the run, defect or source event ↗"}</span></div></div>
      <small>{ru ? "Это описание состава уведомления. Реальные отправки отображаются в журнале." : "This describes message contents. Actual deliveries appear in Activity."}</small>
    </section>}
    {provider === "confluence" && <section className={styles.panel}><header><h2>{ru ? "Структура отчёта" : "Report contents"}</h2></header>
      <ol className={styles.reportContents}><li>{ru ? "Прогон, сборка и окружение" : "Run, build and environment"}</li>
        <li>{ru ? "Результаты: пройдено, ошибки, блокировки" : "Passed, failed and blocked results"}</li>
        <li>{ru ? "Ссылка на полный прогон и доказательства" : "Link to the full run and evidence"}</li></ol>
      <p>{ru ? "Отчёт публикуется после завершения прогона. Каждый прогон связан с одной страницей." : "A report is published when a run completes. Each run is linked to one page."}</p></section>}
  </div>;
}
