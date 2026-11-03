import { useEffect, useRef, useState } from "react";
import { ArrowRotateCw, BookOpen, ChevronRight } from "@openai/apps-sdk-ui/components/Icon";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { CODEX_PLUGIN_VERSION } from "../../domain/model/codex-plugin";
import { CodexMark } from "../branding/CodexMark";
import { codexCopy } from "../copy/codex-copy";
import { CodexResourceState } from "../shared/CodexResourceState";
import { ConnectionTitle } from "../../../presentation/hooks/shared/connection/ConnectionTitle";
import { IntegrationGuideLink } from "../../../presentation/hooks/shared/theme/IntegrationGuideLink";
import { CodexConnectionSetup } from "../plugin-connection/CodexConnectionSetup";
import { OwnCodexConnections } from "./account/OwnCodexConnections";
import surface from "../plugin-surface/plugin.module.css";
import css from "./manager.module.css";

export function CodexPluginManager({ state, locale, onBack, onViewDetails, requestSetup }: {
  state: ReturnType<typeof useCodexEmployee>; locale: "en" | "ru"; onBack: () => void; onViewDetails: () => void; requestSetup?: boolean;
}) {
  const ru = locale === "ru", copy = codexCopy(locale), employee = state.employee;
  const [setupOpen, setSetupOpen] = useState(Boolean(requestSetup));
  const setupRequested = useRef(Boolean(requestSetup));
  useEffect(() => { if (requestSetup && !setupRequested.current) setSetupOpen(true); setupRequested.current = Boolean(requestSetup); }, [requestSetup]);
  const title = useRef<HTMLHeadingElement>(null), setupButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, []);
  const closeSetup = () => { setSetupOpen(false); setupButton.current?.focus(); };
  const full = employee && employee.status !== "active" && employee.capacity.occupied >= employee.capacity.limit;
  const website = employee ? new URL(employee.setup.mcpUrl).origin : null;
  return <main className={surface.surface}>
    <div className={surface.breadcrumb}><button type="button" onClick={onBack}>{ru ? "Настройки плагинов" : "Plugin settings"}</button><ChevronRight width={16} height={16} /><span>Codex</span></div>
    <div className={surface.main}>
      <header className={surface.header}>
        <div className={surface.identity}><div className={surface.logo}><CodexMark /></div><div><h1 ref={title} tabIndex={-1}>Codex</h1><p>{ru ? "QA-задачи с AI в Falcon" : "AI testing workflows in Falcon"}</p></div></div>
        <div className={surface.actions}><button type="button" className={surface.quiet} onClick={onViewDetails}>{ru ? "Открыть карточку" : "View details"}</button></div>
      </header>
      <div className={css.resource}><CodexResourceState loading={state.loading} error={state.error} locale={locale} retry={state.refresh} /></div>
      {employee && <>
        <section className={surface.section} aria-label={ru ? "Подключения" : "Uses"}>
          <h2 className={surface.sectionTitle}>{ru ? "Подключения" : "Uses"}</h2>
          <div className={surface.group}>
            <button type="button" ref={setupButton} className={`${surface.row} ${css.rowButton}`} aria-label={ru ? "Настроить Falcon MCP" : "Configure Falcon MCP"}
              aria-expanded={setupOpen} aria-controls="codex-connection-setup" onClick={() => setSetupOpen(value => !value)}>
              <span className={surface.icon}><CodexMark /></span><span className={surface.rowCopy}><span className={surface.rowTitle}><ConnectionTitle>Falcon MCP</ConnectionTitle></span>
                <span className={surface.rowDescription}>{ru ? "Подключение к Codex, URL сервера и настройка OAuth" : "Codex connection, server URL and OAuth setup"}</span></span><ChevronRight width={18} height={18} className={css.chevron} data-open={setupOpen || undefined} />
            </button>
            <CodexConnectionSetup employee={employee} locale={locale} open={setupOpen} onClose={closeSetup} />
            <IntegrationGuideLink article="codex-web-qa" className={`${surface.row} ${css.rowLink}`}><span className={surface.icon}><BookOpen width={22} height={22} /></span>
              <span className={surface.rowCopy}><span className={surface.rowTitle}>{ru ? "Руководство" : "Guide"}</span><span className={surface.rowDescription}>{ru ? "Подключение, доступ к проектам и полный цикл Web QA" : "Connection setup, project access and the full web QA workflow"}</span></span><ChevronRight width={18} height={18} />
            </IntegrationGuideLink>
          </div>
          <div className={css.company}>
            <dl className={css.companyFacts}>
              <div><dt>{copy.management}</dt><dd><span className={css.status} data-status={employee.status}>{copy[employee.status]}</span></dd></div>
              <div><dt>{copy.seats}</dt><dd className={css.capacity}>{employee.capacity.occupied}<span> / {employee.capacity.limit}</span></dd></div>
            </dl>
            <div className={css.companyActions}>
              {employee.canActivate && <button type="button" className={surface.quiet} disabled={state.loading || state.pending} onClick={() => setSetupOpen(true)}>{copy.activate}</button>}
              {employee.canDeactivate && <button type="button" className={surface.danger} disabled={state.loading || state.pending || Boolean(state.error)} onClick={() => void state.deactivate()}>{copy.disable}</button>}
              <button type="button" className={css.refresh} disabled={state.loading || state.pending} onClick={state.refresh} aria-label={copy.refresh}><ArrowRotateCw width={18} height={18} /></button>
            </div>
          </div>
          <p className={surface.notice}>{copy.explanation}</p>
          {full && <p className={surface.notice}>{copy.full}</p>}
          {!employee.canConnect && !employee.canActivate && <p className={surface.notice}>{employee.status === "active" ? copy.unavailable : copy.pendingConnection}</p>}
        </section>
      </>}
      <OwnCodexConnections state={state} locale={locale} />
      {employee && <>
        <section className={surface.section} aria-label={ru ? "О плагине" : "About"}>
          <h2 className={surface.sectionTitle}>{ru ? "О плагине" : "About"}</h2>
          <div className={surface.group}><dl className={surface.about}>
            <dt>{ru ? "Категория" : "Category"}</dt><dd>{ru ? "AI и тестирование" : "AI and testing"}</dd>
            <dt>{ru ? "Разработчик" : "Developer"}</dt><dd>Falcon</dd>
            <dt>{ru ? "Протокол" : "Transport"}</dt><dd>Streamable HTTP</dd>
            <dt>{ru ? "Авторизация" : "Authentication"}</dt><dd>OAuth</dd>
            <dt>{ru ? "Версия" : "Version"}</dt><dd>{CODEX_PLUGIN_VERSION}</dd>
            <dt>{ru ? "Сайт" : "Website"}</dt><dd><a className={surface.link} href={website ?? undefined}>{website}</a></dd>
            <dt>{ru ? "Политика конфиденциальности" : "Privacy policy"}</dt><dd><a className={surface.link} href={`/privacy/?lang=${locale}`}>{ru ? "Открыть политику" : "View privacy policy"}</a></dd>
          </dl></div>
        </section>
      </>}
    </div>
  </main>;
}
