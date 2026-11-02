import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "@openai/apps-sdk-ui/components/Icon";
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
      <p className={css.intro}>{ru ? "Codex использует OAuth: доступ подтверждается в браузере вашей учётной записью компании. API-ключи и секреты клиента не нужны." : "Codex uses OAuth: confirm access in your browser with your company account. API keys and client secrets are not needed."}</p>
      <label className={css.field} htmlFor="codex-server-name"><span>{ru ? "Имя сервера" : "Server name"}</span>
        <input id="codex-server-name" ref={input} value={name} autoComplete="off" spellCheck={false} aria-invalid={!validName} aria-describedby="codex-name-help"
          onChange={event => { setNameEdit({ url: setup.mcpUrl, value: event.target.value }); setCopied(null); }} />
      </label>
      <p id="codex-name-help" className={surface.notice}>{validName ? (ru ? "Используйте отдельное имя для каждой компании." : "Use a different name for each company.")
        : (ru ? "Используйте латинские буквы, цифры, _ и -; первым символом не может быть -." : "Use letters, numbers, _ and -; the first character cannot be -.")}</p>
      <div className={css.label}>{ru ? "URL сервера" : "Server URL"}</div>
      <div className={css.codeBlock}><code className={css.singleValue}>{setup.mcpUrl}</code>{copyButton("url", setup.mcpUrl, ru ? "Копировать URL сервера" : "Copy server URL")}</div>
      <ol className={css.steps}>
        <li>{ru ? "Откройте Codex: Settings → MCP servers → Add server." : "In Codex, open Settings → MCP servers → Add server."}</li>
        <li>{ru ? "Укажите имя сервера и Server URL выше, выбрав Streamable HTTP." : "Enter the server name and Server URL above, choosing Streamable HTTP."}</li>
        <li>{ru ? "Сохраните настройки и перезапустите Codex, затем выберите Authenticate." : "Save, restart Codex, then choose Authenticate."}</li>
        <li>{ru ? "В браузере войдите в Falcon своей компании, выберите проекты и проверьте запрашиваемые разрешения. Подтвердите только то, с чем согласны." : "In the browser, sign in to your company’s Falcon, select projects and review the requested permissions. Approve only what you accept."}</li>
        <li>{ru ? "Вернитесь в Codex и попросите найти тест-кейсы или подготовить план QA. Проверьте план до выполнения действий." : "Return to Codex and ask it to find test cases or prepare a QA plan. Review the plan before actions are performed."}</li>
      </ol>
      <section className={css.advanced} aria-label={ru ? "Настройка через TOML и CLI" : "TOML and CLI setup"}>
        <h3>config.toml</h3><div className={css.codeBlock}><pre><code>{validName ? toml : ""}</code></pre>
          {copyButton("toml", toml, ru ? "Копировать TOML" : "Copy TOML", !validName)}</div>
        <h3>CLI</h3><div className={css.codeBlock}><pre><code>{validName ? command : ""}</code></pre>
          {copyButton("cli", command, ru ? "Копировать команду" : "Copy command", !validName)}</div>
        <dl className={css.protocol}><dt>Resource</dt><dd>{setup.resource}</dd><dt>OAuth issuer</dt><dd>{setup.oauthIssuer}</dd>
          <dt>{ru ? "Разрешения" : "Scopes"}</dt><dd>{setup.scopes.join(", ")}</dd></dl>
      </section>
      <p role="status" aria-live="polite" className={css.feedback}>{copied?.url === setup.mcpUrl ? copied.result === "error"
        ? (ru ? "Не удалось скопировать. Выделите текст вручную." : "Copy failed. Select the text manually.") : (ru ? "Скопировано." : "Copied.") : ""}</p>
    </div></div>
  </div>;
}
