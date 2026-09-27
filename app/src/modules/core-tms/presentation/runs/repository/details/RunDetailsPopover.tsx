import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Info, X } from "lucide-react";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { useWorkspacePeople } from "../../../../workspace/members/context/WorkspacePeopleContext";
import { ResponsibleName } from "../../../../workspace/members/presentation/ResponsibleName";
import { MarkdownField } from "../../../cases/inspector/markdown/MarkdownField";
import { useAnchoredPopup } from "../../../common/popup/useAnchoredPopup";
import css from "./runDetailsPopover.module.css";

export function RunDetailsPopover({ run, ru }: { run: TestRunSummary; ru: boolean }) {
  const { workspaceId, offline } = useWorkspacePeople();
  const id = useId(); const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null); const closeButton = useRef<HTMLButtonElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, root, trigger, panel, dismiss, 300);
  useEffect(() => { if (open) closeButton.current?.focus({ preventScroll: true }); }, [open]);
  const close = () => { dismiss(); trigger.current?.focus({ preventScroll: true }); };
  return <div className={css.root} ref={root} onKeyDown={(event) => {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
  }} onBlur={(event) => {
    if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) dismiss();
  }}>
    <button type="button" ref={trigger} className={css.trigger} aria-haspopup="dialog" aria-expanded={open}
      aria-controls={open ? id : undefined} onClick={() => setOpen((value) => !value)}>
      <Info size={15} aria-hidden="true" /><span>{ru ? "О прогоне" : "About run"}</span>
    </button>
    {open && <div className={css.panel} ref={panel} id={id} popover="manual" role="dialog"
      aria-labelledby={`${id}-title`} data-testid="run-details-popover">
      <header className={css.header}><h2 id={`${id}-title`}>{ru ? "О прогоне" : "About run"}</h2>
        <button type="button" ref={closeButton} onClick={close} className={css.close}
          aria-label={ru ? "Закрыть сведения о прогоне" : "Close run details"}><X size={16} aria-hidden="true" /></button>
      </header>
      <div className={css.owner}><span>{ru ? "Ответственный за прогон" : "Run owner"}</span>
        <ResponsibleName workspaceId={workspaceId} identityId={run.ownerIdentityId ?? null} offline={offline} />
      </div>
      <section className={css.description} aria-labelledby={`${id}-description`}>
        <h3 id={`${id}-description`}>{ru ? "Описание" : "Description"}</h3>
        <MarkdownField value={run.description ?? ""} label={ru ? "Описание прогона" : "Run description"}
          emptyLabel={ru ? "Описание не указано." : "No description."} allowAttachments={false} />
      </section>
    </div>}
  </div>;
}
