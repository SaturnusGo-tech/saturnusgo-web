import React, { useState } from "react";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
import { CodexMark } from "../branding/CodexMark";
import { CodexResourceState } from "../shared/CodexResourceState";
import { CodexEmployeeManagement } from "../management/CodexEmployeeManagement";
import { PersonalCodexConnection } from "../personal/PersonalCodexConnection";
import { IntegrationGuideLink } from "../../../presentation/hooks/shared/theme/IntegrationGuideLink";
import { defaultServerName, validServerName } from "./setup-name";
import styles from "./setup.module.css";

export function CodexDetail({ state, locale, onBack }: { state: ReturnType<typeof useCodexEmployee>; locale: "en" | "ru"; onBack: () => void }) {
  const ru = locale === "ru";
  const setup = state.employee?.setup;
  const [copied, setCopied] = useState("");
  const copy = async (value: string, name: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(name); }
    catch { setCopied("error"); }
  };
  const [nameEdit, setNameEdit] = useState<{ url: string; value: string } | null>(null);
  const name = setup ? nameEdit?.url === setup.mcpUrl ? nameEdit.value : defaultServerName(setup.mcpUrl) : "";
  const validName = validServerName(name);
  const scopes = setup?.scopes.join(",") ?? "";
  const toml = setup ? `[mcp_servers.${name}]\nurl = ${JSON.stringify(setup.mcpUrl)}\nscopes = [${setup.scopes.map(scope => JSON.stringify(scope)).join(", ")}]` : "";
  return <main className={styles.page}>
    <button type="button" className={styles.back} onClick={onBack}>← {ru ? "Все интеграции" : "All integrations"}</button>
    <header className={styles.header}><CodexMark /><div><h1>Codex</h1><p>{ru ? "Подключите Falcon к Codex для работы с QA." : "Connect Falcon to Codex for QA work."}</p></div>
      <button type="button" disabled={state.pending || state.loading} onClick={state.refresh}>{ru ? "Обновить" : "Refresh"}</button>
      <IntegrationGuideLink article="codex-web-qa">{ru ? "Полное руководство" : "Full guide"}</IntegrationGuideLink></header>
    <CodexResourceState loading={state.loading} error={state.error} locale={locale} retry={state.refresh} />
    {state.employee && <>
      <div className={styles.summary}><CodexEmployeeManagement state={state} locale={locale} setupHere /><PersonalCodexConnection state={state} locale={locale} setupHere /></div>
      <section id="codex-setup" className={styles.steps}>
        <h2>{ru ? "Настройка подключения" : "Set up the connection"}</h2>
        <p>{ru ? "Первое согласие менеджера в OAuth активирует одно место компании. Каждый человек подключается под своей учётной записью. Права проверяются Falcon." : "A manager’s first OAuth consent activates one company seat. Each person connects with their own account. Falcon checks their permissions."}</p>
        {setup && <><label htmlFor="codex-server-name">{ru ? "Имя сервера" : "Server name"}</label>
          <input id="codex-server-name" value={name} aria-invalid={!validName} aria-describedby="codex-name-help" onChange={event => setNameEdit({ url: setup.mcpUrl, value: event.target.value })} />
          <p id="codex-name-help">{validName ? (ru ? "Используйте отдельное имя для каждой компании." : "Use a different name for each company.") : (ru ? "Используйте латинские буквы, цифры, _ и -; первым символом не может быть -." : "Use letters, numbers, _ and -; the first character cannot be -.")}</p>
          <h3>Server URL</h3><div className={styles.value}><code>{setup.mcpUrl}</code><button type="button" onClick={() => void copy(setup.mcpUrl, "url")}>{ru ? "Копировать" : "Copy"}</button></div>
        </>}
        <ol>
          <li>{ru ? "Откройте Codex на компьютере: Settings → MCP servers → Add server." : "In Codex on your computer, open Settings → MCP servers → Add server."}</li>
          <li>{ru ? "Укажите имя сервера и Server URL выше, выбрав Streamable HTTP." : "Enter the server name and Server URL above, choosing Streamable HTTP."}</li>
          <li>{ru ? "Сохраните настройки и перезапустите Codex, затем выберите Authenticate." : "Save, restart Codex, then choose Authenticate."}</li>
          <li>{ru ? "В браузере войдите в Falcon своей компании, выберите проекты и проверьте запрашиваемые разрешения. Подтвердите только то, с чем согласны." : "In the browser, sign in to your company’s Falcon, select projects and review the requested permissions. Approve only what you accept."}</li>
          <li>{ru ? "Вернитесь в Codex и попросите найти тест-кейсы или подготовить план QA. Проверьте план до выполнения действий." : "Return to Codex and ask it to find test cases or prepare a QA plan. Review the plan before actions are performed."}</li>
        </ol>
        {setup && <><p>{ru ? "OAuth обрабатывается Codex и браузером. API-ключ или секрет клиента вводить не нужно." : "Codex and your browser handle OAuth. You do not need to enter an API key or client secret."}</p>
          <details><summary>{ru ? "Настройка через TOML и CLI" : "TOML and CLI setup"}</summary>
            <p>{ru ? "Если используете config.toml, выберите уникальное имя сервера для каждой компании. Добавьте:" : "If you use config.toml, choose a unique server name for each company. Add:"}</p>
            <pre>{validName ? toml : ""}</pre><button type="button" disabled={!validName} onClick={() => void copy(toml, "toml")}>{ru ? "Копировать TOML" : "Copy TOML"}</button>
            <p>{ru ? "Затем выполните вход с указанным именем:" : "Then sign in with this name:"}</p>
            <pre>{validName ? `codex mcp login ${name} --scopes ${scopes}` : ""}</pre><button type="button" disabled={!validName} onClick={() => void copy(`codex mcp login ${name} --scopes ${scopes}`, "cli")}>{ru ? "Копировать команду" : "Copy command"}</button>
            <p>Resource: <code>{setup.resource}</code><br />OAuth issuer: <code>{setup.oauthIssuer}</code></p>
          </details></>}
        <p role="status" aria-live="polite">{copied === "error" ? (ru ? "Не удалось скопировать. Выделите текст вручную." : "Copy failed. Select the text manually.") : copied ? (ru ? "Скопировано." : "Copied.") : ""}</p>
      </section>
    </>}
  </main>;
}
