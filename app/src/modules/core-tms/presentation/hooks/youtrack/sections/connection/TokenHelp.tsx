import { ExternalLink, HelpCircle } from "lucide-react";
import { useId, useState } from "react";
import { IntegrationButton } from "../../../../common/integration-controls/button/IntegrationButton";
import type { HooksCopy } from "../../../shared/hooks-copy";
import surface from "../../../hooks.module.css";

export function TokenHelp({ copy }: { copy: HooksCopy }) {
  const [open, setOpen] = useState(false), id = useId();
  return <span className={surface.tokenHelp} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
    onFocus={() => setOpen(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}
    onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); } }}>
    <IntegrationButton isIconOnly variant="light" aria-label={copy.tokenHelpLabel} aria-haspopup="dialog"
      aria-expanded={open} aria-controls={id} onPress={() => setOpen(true)}><HelpCircle size={16}/></IntegrationButton>
    {open && <aside id={id} role="dialog" aria-label={copy.tokenHelpTitle} className={surface.tokenPopover}>
      <strong>{copy.tokenHelpTitle}</strong><ol>{copy.tokenHelpSteps.map(step => <li key={step}>{step}</li>)}</ol>
      <p>{copy.tokenHelpNote}</p><a href="https://www.jetbrains.com/help/youtrack/cloud/manage-permanent-token.html" target="_blank" rel="noreferrer">
        {copy.tokenHelpLink}<ExternalLink size={13} aria-hidden="true"/></a>
    </aside>}
  </span>;
}
