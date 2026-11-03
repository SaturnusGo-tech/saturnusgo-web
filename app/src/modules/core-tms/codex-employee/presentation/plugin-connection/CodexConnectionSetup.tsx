import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Copy } from "@openai/apps-sdk-ui/components/Icon";
import type { CodexEmployee } from "../../domain/model/codex-employee";
import { defaultServerName, validServerName } from "../setup/setup-name";
import surface from "../plugin-surface/plugin.module.css";
import css from "./connection.module.css";

export function CodexConnectionSetup({ employee, locale, open, onClose }: {
  employee: CodexEmployee; locale: "en" | "ru"; open: boolean; onClose: () => void;
}) {
  const ru = locale === "ru", setup = employee.setup;
  const panel = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null);
  const [nameEdit, setNameEdit] = useState<{ url: string; value: string } | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [copied, setCopied] = useState<{ url: string; id: string; result: "copied" | "error" } | null>(null);
  const name = nameEdit?.url === setup.mcpUrl ? nameEdit.value : defaultServerName(setup.mcpUrl);
  const validName = validServerName(name);
  const toml = `[mcp_servers.${name}]\nurl = ${JSON.stringify(setup.mcpUrl)}\nscopes = [${setup.scopes.map(scope => JSON.stringify(scope)).join(", ")}]`;
  const command = `codex mcp login ${name} --scopes ${setup.scopes.join(",")}`;
  useEffect(() => { if (panel.current) panel.current.inert = !open; if (open) input.current?.focus({ preventScroll: true }); }, [open]);
  const copy = async (value: string, id: string) => {
    try { await navigator.clipboard.writeText(value); setCopied({ url: setup.mcpUrl, id, result: "copied" }); }
    catch { setCopied({ url: setup.mcpUrl, id, result: "error" }); }
  };
  const copyButton = (id: string, value: string, label: string, disabled = false) => {
    const done = copied?.url === setup.mcpUrl && copied.id === id && copied.result === "copied";
    const Icon = done ? Check : Copy;
    return <button type="button" className={css.copy} disabled={disabled} aria-label={label} title={done ? (ru ? "Скопировано" : "Copied") : label}
      onClick={() => { if (!disabled) void copy(value, id); }}><Icon width={16} height={16} aria-hidden="true" /></button>;
  };
  return <div className={css.expansion} data-open={open || undefined} aria-hidden={!open}>
    <div className={css.clipped}><div id="codex-connection-setup" ref={node => { panel.current = node; if (node) node.inert = !open; }}
      className={css.content} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
      <p className={css.intro}>Streamable HTTP <span aria-hidden="true">·</span> OAuth</p>
      <div className={css.field}><label htmlFor="codex-server-name">{ru ? "Имя сервера" : "Server name"}</label>
        <span className={css.nameField}>
        <input id="codex-server-name" ref={input} value={name} autoComplete="off" spellCheck={false} aria-invalid={!validName} aria-describedby="codex-name-help"
          onChange={event => { setNameEdit({ url: setup.mcpUrl, value: event.target.value }); setCopied(null); }} />
        {copyButton("name", name, ru ? "Копировать имя сервера" : "Copy server name", !validName)}</span>
      </div>
      <p id="codex-name-help" className={surface.notice}>{validName ? (ru ? "Используйте отдельное имя для каждой компании." : "Use a different name for each company.")
        : (ru ? "Используйте латинские буквы, цифры, _ и -; первым символом не может быть -." : "Use letters, numbers, _ and -; the first character cannot be -.")}</p>
      <div className={css.label}>{ru ? "URL сервера" : "Server URL"}</div>
      <div className={css.codeBlock}><code className={css.singleValue}>{setup.mcpUrl}</code>{copyButton("url", setup.mcpUrl, ru ? "Копировать URL сервера" : "Copy server URL")}</div>
      <ol className={css.steps}>
        <li><strong>{ru ? "Добавьте сервер в Codex" : "Add the server in Codex"}</strong><p>Settings → Plugins → Add → Add MCP server.</p><p>{ru ? "Вставьте имя и URL выше, выберите Streamable HTTP и сохраните. Bearer token и Headers оставьте пустыми." : "Paste the name and URL above, choose Streamable HTTP and save. Leave Bearer token and Headers empty."}</p></li>
        <li><strong>{ru ? "Подтвердите доступ" : "Authenticate"}</strong><p>Plugins → MCPs → Servers → {name || "…"} → Authenticate.</p><p>{ru ? "В браузере войдите в Falcon своей компании, выберите проекты и разрешения." : "In your browser, sign in to your company’s Falcon and choose projects and permissions."}</p></li>
        <li><strong>{ru ? "Откройте новый чат" : "Open a new chat"}</strong><p>{ru ? "Попросите Codex показать компанию и доступные проекты через этот сервер, ничего не изменяя." : "Ask Codex to show the company and available projects through this server without changing anything."}</p></li>
      </ol>
      <button type="button" className={css.manualToggle} aria-expanded={manualOpen} aria-controls="codex-manual-configuration" onClick={() => setManualOpen(value => !value)}>
        <ChevronRight width={14} height={14} aria-hidden="true" data-open={manualOpen || undefined} />{ru ? "Ручная настройка" : "Manual configuration"}<span>TOML / CLI</span>
      </button>
      <div className={css.expansion} data-open={manualOpen || undefined} aria-hidden={!manualOpen}>
      <div className={css.clipped}><section id="codex-manual-configuration" ref={node => { if (node) node.inert = !manualOpen; }} className={css.advanced} aria-label={ru ? "Настройка через TOML и CLI" : "TOML and CLI setup"}>
        <h3>config.toml</h3><div className={css.codeBlock}><pre><code>{validName ? toml : ""}</code></pre>
          {copyButton("toml", toml, ru ? "Копировать TOML" : "Copy TOML", !validName)}</div>
        <h3>CLI</h3><div className={css.codeBlock}><pre><code>{validName ? command : ""}</code></pre>
          {copyButton("cli", command, ru ? "Копировать команду" : "Copy command", !validName)}</div>
        <dl className={css.protocol}><dt>Resource</dt><dd>{setup.resource}</dd><dt>OAuth issuer</dt><dd>{setup.oauthIssuer}</dd>
          <dt>{ru ? "Разрешения" : "Scopes"}</dt><dd>{setup.scopes.join(", ")}</dd></dl>
      </section></div></div>
      <p role="status" aria-live="polite" className={css.feedback}>{copied?.url === setup.mcpUrl ? copied.result === "error"
        ? (ru ? "Не удалось скопировать. Выделите текст вручную." : "Copy failed. Select the text manually.") : (ru ? "Скопировано." : "Copied.") : ""}</p>
    </div></div>
  </div>;
}
