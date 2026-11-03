import { useEffect, useId, useRef, useState } from "react";
import { BookOpen, ChevronRight } from "@openai/apps-sdk-ui/components/Icon";
import { ConnectorSettings } from "../../../connectors/presentation/ConnectorSettings";
import { isProvider } from "../../../connectors/model/connector-types";
import { providerCopy } from "../../../connectors/localization/connector-copy";
import { useWorkspaceConnectors } from "../../../connectors/application/context/WorkspaceConnectorContext";
import { ApiSourceManager } from "../../../api-sources/presentation/ApiSourceManager";
import { INTEGRATIONS, type IntegrationId } from "../catalog/integration-definitions";
import { IntegrationBrand } from "../shared/brand/IntegrationBrand";
import { ConnectionTitle } from "../shared/connection/ConnectionTitle";
import { IntegrationGuideLink } from "../shared/theme/IntegrationGuideLink";
import { YouTrackSettings } from "../youtrack/YouTrackSettings";
import surface from "../../../codex-employee/presentation/plugin-surface/plugin.module.css";
import css from "./manager.module.css";

export function IntegrationPluginManager({ id, workspaceId, projectId, canManage, capabilities, connected, ru, onBack, onViewDetails, onUpdated, requestSetup = false }: {
  id: IntegrationId; workspaceId: string; projectId: string; canManage: boolean; capabilities: readonly string[]; connected: boolean; ru: boolean;
  onBack: () => void; onViewDetails: () => void; requestSetup?: boolean; onUpdated?: () => void;
}) {
  const integration = INTEGRATIONS.find(item => item.id === id);
  const available = id !== "codex" && (id === "youtrack" || isProvider(id));
  const connectors = useWorkspaceConnectors(), panelId = useId();
  const refresh = onUpdated ?? connectors.refresh;
  const [open, setOpen] = useState(requestSetup), [visited, setVisited] = useState(requestSetup), [settled, setSettled] = useState(requestSetup);
  const heading = useRef<HTMLHeadingElement>(null), trigger = useRef<HTMLButtonElement>(null), requested = useRef(requestSetup);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [id]);
  const reveal = (next: boolean) => {
    if (next) setVisited(true);
    setOpen(next); setSettled(next && Boolean(typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
  };
  useEffect(() => { if (requestSetup && !requested.current) reveal(true); requested.current = requestSetup; }, [requestSetup]);
  const close = () => { reveal(false); trigger.current?.focus(); };
  const docs = isProvider(id) ? providerCopy(id, ru).docs : "https://www.jetbrains.com/help/youtrack/cloud/";
  const group = integration?.group === "tracker" ? (ru ? "Задачи и планирование" : "Tasks and planning") : integration?.group === "delivery"
    ? (ru ? "Код и сборки" : "Code and builds") : integration?.group === "api" ? (ru ? "API и контракты" : "API and contracts")
      : (ru ? "Коммуникация и знания" : "Communication and knowledge");
  return <main className={surface.surface}>
    <div className={surface.breadcrumb}><button type="button" onClick={onBack}>{ru ? "Настройки плагинов" : "Plugin settings"}</button><ChevronRight width={16} height={16} /><span>{integration?.name ?? id}</span></div>
    <div className={surface.main}>
      <header className={surface.header}><div className={surface.identity}><div className={`${surface.logo} ${css.brand}`}><IntegrationBrand provider={id} /></div>
        <div><h1 ref={heading} tabIndex={-1}>{integration?.name ?? id}</h1><p>{integration?.description[ru ? "ru" : "en"]}</p></div></div>
        <div className={surface.actions}><button type="button" className={surface.quiet} onClick={onViewDetails}>{ru ? "Открыть карточку" : "View details"}</button></div>
      </header>
      {!available ? <p className={surface.notice}>{ru ? "Настройка этого сервиса пока недоступна." : "Setup is not available for this service yet."}</p> : <>
        <section className={surface.section} aria-label={ru ? "Подключения" : "Uses"}>
          <h2 className={surface.sectionTitle}>{ru ? "Подключения" : "Uses"}</h2>
          <div className={`${surface.group} ${css.usesGroup}`}>
            <button ref={trigger} type="button" className={`${surface.row} ${css.rowButton}`} aria-expanded={open} aria-controls={panelId}
              onClick={() => reveal(!open)}>
              <span className={`${surface.icon} ${css.rowBrand}`}><IntegrationBrand provider={id} /></span>
              <span className={surface.rowCopy}><span className={surface.rowTitle}><ConnectionTitle>{ru ? "Настроить подключение" : "Connection setup"}</ConnectionTitle></span>
                <span className={surface.rowDescription}>{id === "swagger" ? (ru ? "Подключённые API, спецификации и доступ к проектам" : "Connected APIs, specifications and project access")
                  : (ru ? "Авторизация, правила и состояние интеграции" : "Authorization, rules and integration status")}</span></span>
              <ChevronRight width={18} height={18} className={css.chevron} data-open={open || undefined} />
            </button>
            <div className={css.expansion} data-open={open || undefined} aria-hidden={!open} onTransitionEnd={event => {
              if (event.target === event.currentTarget && event.propertyName === "grid-template-rows") setSettled(open);
            }}><div className={css.clipped} data-settled={settled || undefined}>
              <div id={panelId} className={css.configuration} ref={element => { if (element) element.inert = !open; }}
                onKeyDown={event => {
                  if (event.key === "Escape" && !event.defaultPrevented && !(event.target as Element).closest?.('[role="dialog"], [role="menu"], select')) {
                    event.stopPropagation(); close();
                  }
                }}>
                {visited && (id === "youtrack" ? <YouTrackSettings embedded workspaceId={workspaceId} status={null} languageTag={ru ? "ru-RU" : "en-US"}
                  russian={ru} canManage={canManage} onBack={close} onStatusChange={refresh} />
                  : id === "swagger" ? canManage ? <ApiSourceManager embedded workspaceId={workspaceId} projectId={projectId} onBack={close} onSaved={refresh} />
                    : <p className={surface.notice}>{ru ? "Настройка API доступна администратору или QA-менеджеру." : "An administrator or QA manager can configure APIs."}</p>
                  : isProvider(id) && <ConnectorSettings embedded key={`${workspaceId}:${projectId}:${id}`} workspaceId={workspaceId} projectId={projectId} provider={id}
                    ru={ru} canManage={canManage} capabilities={capabilities} connected={connected} onBack={close} onSaved={refresh} />)}
              </div>
            </div></div>
            <IntegrationGuideLink article={id} className={`${surface.row} ${css.rowLink}`}><span className={surface.icon}><BookOpen width={22} height={22} /></span>
              <span className={surface.rowCopy}><span className={surface.rowTitle}>{ru ? "Руководство" : "Guide"}</span>
                <span className={surface.rowDescription}>{ru ? "Подключение и работа с интеграцией в Falcon" : "Connect and use this integration in Falcon"}</span></span><ChevronRight width={18} height={18} />
            </IntegrationGuideLink>
          </div>
        </section>
        <section className={surface.section} aria-label={ru ? "О плагине" : "About"}>
          <h2 className={surface.sectionTitle}>{ru ? "О плагине" : "About"}</h2><div className={surface.group}><dl className={surface.about}>
            <dt>{ru ? "Категория" : "Category"}</dt><dd>{group}</dd>
            <dt>{ru ? "Разработчик интеграции" : "Integration developer"}</dt><dd>Falcon</dd>
            <dt>{ru ? "Область настройки" : "Settings scope"}</dt><dd>{id === "youtrack" || id === "swagger" ? (ru ? "Рабочее пространство" : "Workspace") : (ru ? "Выбранный проект" : "Selected project")}</dd>
            <dt>{ru ? "Документация сервиса" : "Service documentation"}</dt><dd><a className={surface.link} href={docs} target="_blank" rel="noreferrer">{ru ? "Открыть документацию" : "View documentation"}</a></dd>
            <dt>{ru ? "Политика конфиденциальности" : "Privacy policy"}</dt><dd><a className={surface.link} href={`/privacy/?lang=${ru ? "ru" : "en"}`}>{ru ? "Открыть политику" : "View privacy policy"}</a></dd>
          </dl></div>
        </section>
      </>}
    </div>
  </main>;
}
