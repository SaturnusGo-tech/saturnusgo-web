import { MemberAvatar } from "../../../workspace/members/avatar/MemberAvatar";
import { ContentSkeleton } from "../../../presentation/common/skeleton/ContentSkeleton";
import { MarkdownField } from "../../../presentation/cases/inspector/markdown/MarkdownField";
import { WorkflowSelect } from "../../management/presentation/WorkflowSelect";
import type { WorkflowPhase } from "../../management/model/organization";
import { organizationCopy } from "../../management/model/copy";
import { useState } from "react";
import { PiArrowClockwise, PiPaperPlaneRight } from "react-icons/pi";
import { formatTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { FormError } from "../../../presentation/common/error/FormError";
import { discussionCopy } from "../model/copy";
import type { DiscussionScope } from "../model/discussion";
import { useDiscussion } from "../state/useDiscussion";
import shared from "../../presentation/styles/portfolios.module.css";
import css from "./discussion.module.css";

export function OrganizationDiscussion({ canPost, workflowPhase = "new", phaseDisabled = true, onPhaseChange, ...scope }: DiscussionScope & {
  canPost: boolean; workflowPhase?: WorkflowPhase; phaseDisabled?: boolean; onPhaseChange?: (value: WorkflowPhase) => void;
}) {
  const { locale } = useTmsLocale();
  const copy = discussionCopy(locale);
  const state = useDiscussion(scope, canPost);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  return <section className={css.discussion}>
    <header><h2>{copy.title}</h2><button type="button" className={shared.iconButton} disabled={state.loading} onClick={state.reload}
      aria-label={copy.refresh} title={copy.refresh}><PiArrowClockwise aria-hidden="true" /></button></header>
    {canPost && <form className={css.composer} onSubmit={async (event) => {
      event.preventDefault(); setSent(false);
      if (await state.post(body)) { setBody(""); setSent(true); }
    }}>
      <div className={css.statusStrip}><span>{organizationCopy(locale).phase}</span><WorkflowSelect value={workflowPhase}
        disabled={phaseDisabled || state.command.pending} onChange={(value) => onPhaseChange?.(value)} /></div>
      <div className={css.editor} data-has-body={Boolean(body.trim()) || undefined} aria-busy={state.command.pending}><MarkdownField label={copy.label} value={body} emptyLabel={copy.placeholder} allowAttachments={false}
        onChange={(value) => { if (!state.command.pending) { setBody(value); setSent(false); } }} />
        {Boolean(body.trim()) && <button className={`${shared.primary} ${css.send}`} disabled={state.command.pending || body.length > 20000}>
          <PiPaperPlaneRight aria-hidden="true" />{state.command.pending ? copy.sending : copy.send}</button>}
      </div>
      {body.length > 20000 && <p className={css.limit} role="alert">{locale === "ru" ? "Не более 20 000 символов." : "Maximum 20,000 characters."}</p>}
      <span className={css.feedback} role="status">{sent ? copy.sent : ""}</span>
    </form>}
    {state.command.error && <FormError message={formatTmsMutationFailure(state.command.error, copy.sendError)} />}
    {state.loading && !state.items.length && <ContentSkeleton compact variant="list" label={copy.loading} />}
    {state.error && <div className={shared.error}><FormError message={formatTmsMutationFailure(state.error, copy.loadError)} />
      <button type="button" className={shared.secondary} onClick={state.reload}>{copy.retry}</button></div>}
    <ol className={css.comments}>{state.items.map((item) => <li key={item.id}>
      <div><MemberAvatar identityId={item.author.identityId} name={item.author.displayName} /><strong>{item.author.displayName}</strong><time dateTime={item.createdAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time></div>
      <MarkdownField label={copy.label} value={item.body} allowAttachments={false} />
    </li>)}</ol>
    {state.cursor && <button type="button" className={shared.textButton} disabled={state.loading} onClick={state.loadMore}>{copy.more}</button>}
  </section>;
}
