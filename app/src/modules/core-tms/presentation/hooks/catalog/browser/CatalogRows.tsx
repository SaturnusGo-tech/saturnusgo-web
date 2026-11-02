import { Check, ChevronRight, Plus } from "@openai/apps-sdk-ui/components/Icon";
import { IntegrationBrand } from "../../shared/brand/IntegrationBrand";
import type { HooksCopy } from "../../shared/hooks-copy";
import { INTEGRATION_GROUPS, type IntegrationId } from "../integration-definitions";
import type { CatalogEntry } from "../model/catalog-model";
import styles from "../catalog.module.css";

export function CatalogRows({ entries, russian, copy, companyStatus, onOpen, onGroup }: {
  entries: readonly CatalogEntry[]; russian: boolean; copy: HooksCopy;
  companyStatus?: "active" | "inactive" | "not_activated" | null;
  onOpen: (id: IntegrationId) => void; onGroup: (group: typeof INTEGRATION_GROUPS[number]) => void;
}) {
  return <div className={styles.sections}>
    {INTEGRATION_GROUPS.map(group => {
      const items = entries.filter(entry => entry.integration.group === group);
      return items.length ? <section className={styles.section} key={group} aria-label={copy.groups[group]}>
        <h2><button type="button" onClick={() => onGroup(group)}>{copy.groups[group]}<ChevronRight width={16} height={16} aria-hidden="true" /></button></h2>
        <div className={styles.grid}>{items.map(({ integration, status }) => {
          const label = integration.id === "codex" && companyStatus && status !== "attention" && status !== "checking"
            ? companyStatus === "active" ? (russian ? "Активен в компании" : "Company active") : (russian ? "Не активен в компании" : "Company inactive")
            : copy.statuses[status];
          const content = <>
            <span className={styles.logo} data-provider={integration.id} aria-hidden="true"><IntegrationBrand provider={integration.id} /></span>
            <span className={styles.rowCopy}><strong className={styles.name}>{integration.name}</strong>
              <span className={styles.description}>{russian ? integration.description.ru : integration.description.en}</span>
            </span>
            <span className={styles.rowAction} data-status={status}>
              {status === "available" ? <><span className={styles.srOnly}>{label}</span><Plus width={20} height={20} aria-hidden="true" /></>
                : <><span>{label}</span>{status === "connected" && <Check width={16} height={16} aria-hidden="true" />}</>}
            </span>
          </>;
          return status === "planned" ? <div className={styles.row} key={integration.id} aria-disabled="true" data-planned="true">{content}</div>
            : <button type="button" className={styles.row} key={integration.id} onClick={() => onOpen(integration.id)}>{content}</button>;
        })}</div>
      </section> : null;
    })}
  </div>;
}
