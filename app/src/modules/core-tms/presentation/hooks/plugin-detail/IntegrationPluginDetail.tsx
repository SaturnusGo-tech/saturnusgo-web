import { ChevronRight } from "@openai/apps-sdk-ui/components/Icon";
import { useEffect, useRef } from "react";
import type { IntegrationId } from "../catalog/integration-definitions";
import type { IntegrationUiStatus } from "../shared/IntegrationStatusBadge";
import { IntegrationBrand } from "../shared/brand/IntegrationBrand";
import { PluginInstallAction } from "../shared/plugin-install/PluginInstallAction";
import { usePluginRegistration } from "../shared/plugin-registration/usePluginRegistration";
import { pluginContent } from "./content/plugin-content";
import surface from "../../../codex-employee/presentation/plugin-surface/plugin.module.css";
import css from "./detail.module.css";

type Props = { id: IntegrationId; ru: boolean; status: IntegrationUiStatus; accountKey: string; scopeKey: string; disabled?: boolean; onBack: () => void; onManage: () => void };
export function IntegrationPluginDetail({ id, ru, status, accountKey, scopeKey, disabled = false, onBack, onManage }: Props) {
  const content = pluginContent(id, ru), heading = useRef<HTMLHeadingElement>(null);
  const installation = usePluginRegistration({ id, accountKey, scopeKey });
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [id]);
  return <main className={surface.scroll} data-plugin-detail={id}>
    <nav className={surface.breadcrumb} aria-label={ru ? "Навигация интеграции" : "Integration navigation"}><button type="button" onClick={onBack}>{ru ? "Плагины" : "Plugins"}</button><ChevronRight width={16} height={16} /><span>{content.name}</span></nav>
    <div className={surface.main}>
      <header className={surface.header}><div className={surface.identity}><div className={`${surface.logo} ${css.brand}`}><IntegrationBrand provider={id} /></div><div><h1 ref={heading} tabIndex={-1}>{content.name}</h1><p>Falcon · {content.description}</p></div></div>
        <PluginInstallAction installed={installation.prepared} installing={installation.phase === "loading"} disabled={disabled} ru={ru} canManage={status === "connected"} onInstall={() => void installation.install()} onManage={onManage} />
      </header>
      {installation.phase === "error" && <p className={surface.notice} role="alert">{ru ? "Не удалось подготовить плагин. Попробуйте ещё раз." : "Could not prepare the plugin. Try again."}</p>}
      <div className={css.preview} data-brand={id} aria-label={ru ? "Возможности интеграции" : "Integration workflows"}>
        <div className={css.workflows}>{content.workflows.map(text => <div key={text}><span className={css.workflowLogo}><IntegrationBrand provider={id} /></span><span>{text}</span><span className={css.falcon}>Falcon</span></div>)}</div>
      </div>
      <p className={css.description}>{content.purpose}</p>
      <section className={surface.section}><h2 className={surface.sectionTitle}>{ru ? "Подключения" : "Connections"} <span>1</span></h2>
        <button type="button" className={css.connection} onClick={onManage} disabled={disabled}>
          <span className={`${surface.icon} ${css.rowBrand}`}><IntegrationBrand provider={id} /></span><span className={surface.rowCopy}><strong>{content.name}</strong><span>{id === "swagger" ? (ru ? "Спецификации, авторизация и доступ к API" : "Specifications, authorization and API access") : (ru ? "Авторизация, правила и события интеграции" : "Authorization, rules and integration events")}</span></span>
          <span className={css.status}>{status === "connected" ? (ru ? "Подключено" : "Connected") : status === "attention" ? (ru ? "Проверить" : "Review") : (ru ? "Настроить" : "Set up")}</span><ChevronRight width={17} height={17} />
        </button>
      </section>
      <section className={surface.section}><h2 className={surface.sectionTitle}>{ru ? "Информация" : "Information"}</h2><dl className={surface.about}>
        <dt>{ru ? "Категория" : "Category"}</dt><dd>{content.category}</dd><dt>{ru ? "Разработчик интеграции" : "Integration developer"}</dt><dd>Falcon</dd>
        <dt>{ru ? "Область настройки" : "Settings scope"}</dt><dd>{id === "youtrack" || id === "swagger" ? (ru ? "Рабочее пространство" : "Workspace") : (ru ? "Выбранный проект" : "Selected project")}</dd>
        <dt>{ru ? "Конфиденциальность" : "Privacy"}</dt><dd><a className={surface.link} href={`/privacy/?lang=${ru ? "ru" : "en"}`}>{ru ? "Политика конфиденциальности" : "View privacy policy"}</a></dd>
      </dl></section>
    </div>
  </main>;
}
