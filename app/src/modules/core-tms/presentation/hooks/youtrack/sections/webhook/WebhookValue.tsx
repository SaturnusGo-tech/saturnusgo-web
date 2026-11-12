import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";
import { IntegrationInput } from "../../../../common/integration-controls/input/IntegrationInput";
import { IntegrationButton } from "../../../../common/integration-controls/button/IntegrationButton";
import type { HooksCopy } from "../../../shared/hooks-copy";
import surface from "../../../hooks.module.css";

export function WebhookValue({ label, value, type = "text", copied, copy, action, onCopy }: {
  label: string; value: string; type?: "text" | "password"; copied: boolean; copy: HooksCopy; action?: ReactNode; onCopy: () => void;
}) {
  return <IntegrationInput label={label} type={type} value={value} isReadOnly spellCheck="false"
    endContent={<span className={surface.webhookValueActions}>{action}
      <IntegrationButton variant="light" onPress={onCopy} aria-label={`${copy.copyValue}: ${label}`}>
        {copied ? <Check size={15} aria-hidden="true"/> : <Copy size={15} aria-hidden="true"/>}
        <span>{copied ? copy.copiedValue : copy.copyValue}</span>
      </IntegrationButton>
    </span>}/>;
}
