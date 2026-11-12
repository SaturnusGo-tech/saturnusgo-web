import type { ReactNode } from "react";
import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { ArrowLeft, BookOpen, GitBranch, Hash, Settings2, Activity, Zap, ChevronRight } from "lucide-react";
import { IntegrationBrand } from "../../../presentation/hooks/shared/brand/IntegrationBrand";
import type { Provider } from "../../model/connector-types";
import { providerCopy } from "../../localization/connector-copy";
import styles from "../styles/connector.module.css";
import inline from "../styles/embedded.module.css";
export type ConnectorTab = "connection" | "automation" | "activity" | "impact";
export function ConnectorChrome({ provider, ru, tab, onTab, onBack, project, enabled, children, embedded = false }: {
  provider: Provider; ru: boolean; tab: ConnectorTab; onTab: (tab: ConnectorTab) => void;
  onBack: () => void; project: string; enabled: boolean; children: ReactNode; embedded?: boolean;
}) {
  const logo = <IntegrationBrand provider={provider} />; const copy = providerCopy(provider, ru);
  const tabs = [
    { id: "connection" as const, icon: Settings2, label: ru ? "Подключение" : "Connection" },
    ...(provider === "swagger" ? [] : [{ id: "automation" as const, icon: Zap, label: ru ? "Автоматизация" : "Automation" },
    { id: "activity" as const, icon: Activity, label: ru ? "Журнал и связи" : "Activity & links" }]),
    ...(provider === "github" ? [{ id: "impact" as const, icon: GitBranch, label: "Impact Analysis" }] : []),
  ];
  if (embedded) return <section className={`${styles.root} ${inline.embedded}`} data-provider={provider} data-embedded data-integration-workspace data-testid={`connector-${provider}`}>
    <nav className={inline.tabs} aria-label={ru ? "Разделы интеграции" : "Integration sections"}>{tabs.map(item => <IntegrationButton type="button" variant="light" key={item.id}
      aria-current={tab === item.id ? "page" : undefined} onPress={() => onTab(item.id)}>{item.label}</IntegrationButton>)}</nav>
    <div className={inline.content}>{children}</div>
  </section>;
  return <main className={styles.root} data-provider={provider} data-integration-workspace data-testid={`connector-${provider}`}>
    <header className={styles.topbar}>
      <IntegrationButton type="button" variant="light" className={styles.back} onPress={onBack}><ArrowLeft size={16} />{ru ? "Интеграции" : "Integrations"}</IntegrationButton>
      <span className={styles.brand}>{logo}{copy.name}</span>
      <span className={styles.scope}>{project}</span>
      <span className={styles.badge} data-active={enabled}>{enabled ? (ru ? "Включено" : "Enabled") : (ru ? "Не активно" : "Inactive")}</span>
    </header>
    {provider === "github" && <div className={styles.repoHeader}><GitBranch size={18} /><strong>{project}</strong><span>/</span><span>Falcon QA</span><span className={styles.repoLabel}>Integration</span></div>}
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sideHeading}>{provider === "slack" ? <Hash size={18} /> : logo}<strong>{provider === "linear" ? project : copy.name}</strong></div>

        <nav aria-label={ru ? "Разделы интеграции" : "Integration sections"}>
          {tabs.map((item) => <IntegrationButton type="button" variant="light" key={item.id} aria-current={tab === item.id ? "page" : undefined}
            onPress={() => onTab(item.id)}><item.icon size={16} />{item.label}</IntegrationButton>)}
        </nav>
        <a href={copy.docs} target="_blank" rel="noreferrer"><BookOpen size={15} />{ru ? "Документация сервиса" : "Service documentation"}</a>
      </aside>
      <div className={styles.content}>
        <div className={styles.breadcrumb}>{project}<ChevronRight size={13} />{copy.name}<ChevronRight size={13} />{tabs.find((item) => item.id === tab)?.label}</div>
        <header className={styles.hero}><h1>{copy.heading}</h1><p>{provider === "github" && tab === "impact"
            ? (ru ? "Успешная сборка открывает черновик состава проверки. QA проверяет причины выбора и подтверждает тесты перед запуском."
              : "A successful build opens a draft verification scope. QA reviews the selection evidence and approves the tests before starting.")
            : copy.purpose}</p></header>
        {children}
      </div>
    </div>
  </main>;
}
