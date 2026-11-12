import { ExternalLink, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import type { YouTrackWebhookSetup } from "../../../../../youtrack/model/youtrack-settings";
import surface from "../../../hooks.module.css";
import type { HooksCopy } from "../../../shared/hooks-copy";
import { SettingsSection } from "../../form/SettingsSection";
import { IntegrationButton } from "../../../../common/integration-controls/button/IntegrationButton";
import { WebhookValue } from "./WebhookValue";

export function WebhookSection({ copy, setup, status }: {
  copy: HooksCopy;
  setup: YouTrackWebhookSetup | null;
  status: "idle" | "loading" | "ready" | "unavailable";
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<"url" | "header" | "token" | null>(null);

  async function copyValue(key: "url" | "header" | "token", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => current === key ? null : current), 1400);
    } catch { /* The value remains selectable in its field. */ }
  }

  return <SettingsSection title={copy.webhook} description={copy.webhookHint}>
    {!setup ? <p className={surface.webhookEmpty}>
      {status === "loading" ? copy.webhookLoading : copy.webhookUnavailable}
    </p> : <>
      <div className={surface.webhookValues}>
        <WebhookValue label={copy.webhookUrl} value={setup.callbackUrl} copied={copied === "url"}
          copy={copy} onCopy={() => void copyValue("url", setup.callbackUrl)} />
        <WebhookValue label={copy.webhookHeader} value={setup.authentication.headerName}
          copied={copied === "header"} copy={copy}
          onCopy={() => void copyValue("header", setup.authentication.headerName)} />
        <WebhookValue label={copy.webhookToken} value={setup.authentication.headerValue}
          type={revealed ? "text" : "password"} copied={copied === "token"} copy={copy}
          onCopy={() => void copyValue("token", setup.authentication.headerValue)}
          action={<IntegrationButton isIconOnly variant="light" onPress={() => setRevealed((value) => !value)}
            aria-label={revealed ? copy.hideToken : copy.showToken}>
            {revealed ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          </IntegrationButton>} />
      </div>
      <ol className={surface.webhookSteps}>
        {copy.webhookSteps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <div className={surface.webhookFoot}>
        <small>{copy.webhookSecurity}</small>
        <a href="https://www.jetbrains.com/help/youtrack/server/webhook-triggers.html"
          target="_blank" rel="noreferrer">{copy.webhookGuide}<ExternalLink size={13} aria-hidden="true" /></a>
      </div>
    </>}
  </SettingsSection>;
}
