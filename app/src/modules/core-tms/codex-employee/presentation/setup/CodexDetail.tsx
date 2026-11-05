import { ChevronRight } from "@openai/apps-sdk-ui/components/Icon";
import { useEffect, useRef } from "react";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { CODEX_PLUGIN_VERSION } from "../../domain/model/codex-plugin";
import { CodexMark } from "../branding/CodexMark";
import { CodexResourceState } from "../shared/CodexResourceState";
import { CodexPluginPreview } from "../plugin-preview/CodexPluginPreview";
import { useCodexInstall } from "./installation/useCodexInstall";
import { PluginInstallAction } from "../../../presentation/hooks/shared/plugin-install/PluginInstallAction";
import surface from "../plugin-surface/plugin.module.css";
import css from "./setup.module.css";

type Props = { state: ReturnType<typeof useCodexEmployee> & { connection?: NonNullable<ReturnType<typeof useCodexEmployee>["employee"]>["setup"]; canConnect?: boolean; readOnly?: boolean }; locale: "en" | "ru"; onBack: () => void; onManage?: () => void; accountKey?: string };
export function CodexDetail({ state, locale, onBack, onManage = () => {}, accountKey = "account" }: Props) {
  const ru = locale === "ru", employee = state.employee;
  const title = useRef<HTMLHeadingElement>(null);
  const installation = useCodexInstall(state.connection ?? employee?.setup, accountKey);
  const prepared = installation.prepared;
  const installing = installation.phase === "loading";
  useEffect(() => { title.current?.focus({ preventScroll: true }); }, []);
  return <main className={surface.scroll}>
    <nav className={surface.breadcrumb} aria-label={ru ? "Навигация интеграции" : "Integration navigation"}>
      <button type="button" onClick={onBack}>{ru ? "Плагины" : "Plugins"}</button><ChevronRight width={16} height={16} /><span>Codex</span>
    </nav>
    <div className={surface.main}>
      <header className={surface.header}>
        <div className={surface.identity}><div className={surface.logo}><CodexMark /></div><div><h1 ref={title} tabIndex={-1}>Codex</h1>
          <p>{ru ? "Falcon · Полный QA-цикл из Codex" : "Falcon · Your QA workflow in Codex"}</p></div></div>
        <div className={surface.actions}><PluginInstallAction installed={prepared} installing={installing} disabled={state.loading || !(state.connection ?? employee?.setup)} ru={ru}
          canManage={state.canConnect ?? employee?.status === "active"} onInstall={() => void installation.install()} onManage={onManage} /></div>
      </header>
      <CodexResourceState loading={state.loading} error={state.error} locale={locale} retry={state.refresh} />
      {state.readOnly && <p className={surface.notice}>{ru ? "Доступны только чтение и экспорт. Изменения и выполнение отключены." : "Read and export access only. Changes and execution are disabled."}</p>}
      {installation.phase === "error" && <p className={surface.notice} role="alert">{ru ? "Не удалось подготовить интеграцию. Повторите установку." : "Could not prepare the integration. Try installing again."}</p>}
      <CodexPluginPreview ru={ru} />
      <p className={css.description}>{ru ? "Поручайте Codex подготовку и обновление тест-кейсов, организацию репозитория, создание прогонов и разбор результатов в Falcon. Работайте с требованиями, URL, PDF и Figma — в рамках своих прав и выбранных проектов."
        : "Use Codex to prepare and update test cases, organize the repository, create test runs, and review results in Falcon. Work from requirements, URLs, PDFs, and Figma within your permissions and selected projects."}</p>
      {!(state.canConnect ?? employee?.status === "active") && <p className={surface.notice}>{ru ? "Подключите Codex к пространству через OAuth в «Управлять»." : "Connect Codex to your workspace through OAuth in Manage."}</p>}
      <section className={surface.section}>
        <h2 className={surface.sectionTitle}>{ru ? "Подключения" : "Connections"} <span>1</span></h2>
        <button type="button" className={css.connection} onClick={onManage} disabled={!(state.connection ?? employee?.setup) || state.loading}>
          <span className={surface.icon}><CodexMark /></span><span className={surface.rowCopy}><strong>Falcon MCP</strong><span>{ru ? "Кейсы, папки, прогоны, выполнение и отчётность в ваших проектах." : "Test cases, folders, runs, execution, and reporting in your projects."}</span></span>
          <span className={css.status}>{(state.canConnect ?? employee?.status === "active") ? (ru ? "Активен" : "Active") : (ru ? "Настроить" : "Set up")}</span><ChevronRight width={17} height={17} />
        </button>
      </section>
      <section className={surface.section}><h2 className={surface.sectionTitle}>{ru ? "Информация" : "Information"}</h2>
        <dl className={surface.about}><dt>{ru ? "Возможности" : "Capabilities"}</dt><dd>{ru ? "QA-процессы и MCP-инструменты" : "QA workflows and MCP tools"}</dd>
          <dt>{ru ? "Разработчик плагина" : "Plugin developer"}</dt><dd>Falcon</dd><dt>{ru ? "Платформа" : "Platform"}</dt><dd>Codex · OpenAI</dd>
          <dt>{ru ? "Категория" : "Category"}</dt><dd>{ru ? "AI и автоматизация" : "AI & automation"}</dd><dt>{ru ? "Версия" : "Version"}</dt><dd>{CODEX_PLUGIN_VERSION}</dd>
          <dt>{ru ? "Конфиденциальность" : "Privacy"}</dt><dd><a className={surface.link} href={`/privacy/?lang=${locale}`} target="_blank" rel="noopener noreferrer">{ru ? "Политика конфиденциальности" : "View privacy policy"}</a></dd></dl>
      </section>
    </div>
  </main>;
}
