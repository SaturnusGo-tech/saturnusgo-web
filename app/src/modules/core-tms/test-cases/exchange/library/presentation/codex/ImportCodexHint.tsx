import { useEffect, useId, useState, type MouseEvent } from "react";
import { ChevronRight } from "lucide-react";
import { CodexMark } from "../../../../../codex-employee/presentation/branding/CodexMark";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { IntegrationGuideLink } from "../../../../../presentation/hooks/shared/theme/IntegrationGuideLink";
import { visitWorkspace } from "../../../../../state/navigation/browser/workspace-history";
import { useImportCodexConnection } from "../../../state/codex/use-import-codex-connection";
import { importCodexSetupLink } from "../../../state/codex/import-codex-connection";
import { codexImportCopy } from "../../../localization/codex/copy";
import css from "./import-codex-hint.module.css";

export function ImportCodexHint({ workspaceId, projectId, canManage, busy }: {
  workspaceId: string; projectId: string; canManage: boolean; busy: boolean;
}) {
  const { locale } = useTmsLocale();
  const copy = codexImportCopy[locale];
  const state = useImportCodexConnection(workspaceId, projectId, canManage);
  const title = useId();
  const scope = JSON.stringify([workspaceId, projectId]);
  const [link, setLink] = useState<{ scope: string; href: string } | null>(null);
  const fallback = "?" + new URLSearchParams({ workspaceId, projectId, view: "config", settings: "plugins", plugin: "codex", pluginSetup: "connect" });
  const setupHref = link?.scope === scope ? link.href : fallback;
  useEffect(() => { setLink({ scope, href: importCodexSetupLink(window.location.href, workspaceId, projectId) }); }, [scope, workspaceId, projectId]);
  const ready = state.status === "ready";
  const description = !canManage && (state.status === "available" || state.status === "limited") ? copy.readOnly : copy[state.status];
  const setup = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); visitWorkspace(importCodexSetupLink(window.location.href, workspaceId, projectId));
  };
  return <aside className={css.hint} aria-labelledby={title}>
    <CodexMark className={css.mark} />
    <div className={css.content}>
      <strong id={title}>{copy.title}</strong>
      <p role="status" aria-live="polite">{description}{ready && !state.canUpload && <> {copy.upload}</>}</p>
      <ol className={css.links}>
        {!ready && <>
          <li>{state.pluginUrl && !busy ? <a href={state.pluginUrl} target="_blank" rel="noopener noreferrer">{copy.install}</a>
            : <span aria-disabled={busy || !state.pluginUrl}>{copy.install}</span>}<ChevronRight size={12} aria-hidden="true" /></li>
          <li>{busy ? <span aria-disabled="true">{copy.setup}</span> : <a href={setupHref} onClick={setup}>{copy.setup}</a>}
            <ChevronRight size={12} aria-hidden="true" /></li>
        </>}
        <li>{busy ? <span aria-disabled="true">{copy.guide}</span>
          : <IntegrationGuideLink article="codex-capabilities-exchange">{copy.guide}</IntegrationGuideLink>}</li>
      </ol>
    </div>
  </aside>;
}
