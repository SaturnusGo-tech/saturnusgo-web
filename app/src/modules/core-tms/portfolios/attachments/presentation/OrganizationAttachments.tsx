import { useRef, useState } from "react";
import { PiPaperclip, PiArrowClockwise, PiX } from "react-icons/pi";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AttachmentLink } from "../../../attachments/presentation/link/AttachmentLink";
import { FormError } from "../../../presentation/common/error/FormError";
import { formatTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import type { OrganizationTarget } from "../../management/model/organization";
import { useOrganizationAttachments } from "../state/useOrganizationAttachments";
import { organizationAttachmentCopy } from "../model/copy";
import css from "./attachments.module.css";
export function OrganizationAttachments({ target, canRead, canManage }: { target: OrganizationTarget; canRead: boolean; canManage: boolean }) {
  const { locale } = useTmsLocale(); const copy = organizationAttachmentCopy(locale);
  const input = useRef<HTMLInputElement>(null);
  const [selectionError, setSelectionError] = useState(false);
  const state = useOrganizationAttachments(target, canRead, canManage);
  if (!canRead && !canManage) return null;
  return <section data-organization-files className={css.files} aria-label={copy.title}>
    <div className={css.actions}>{canManage && <><input ref={input} type="file" multiple hidden disabled={state.pending} onChange={(event) => {
      const files = Array.from(event.target.files ?? []); event.target.value = "";
      setSelectionError(files.length > 20); if (files.length <= 20) state.add(files);
    }} /><button type="button" className={css.action} disabled={state.pending} onClick={() => input.current?.click()}><PiPaperclip />{copy.attach}</button></>}
      {canRead && (state.items.length > 0 || state.error) && <button type="button" className={css.icon} disabled={state.loading} aria-label={copy.refresh} onClick={state.reload}><PiArrowClockwise /></button>}
    </div>
    {selectionError && <FormError message={copy.limit} />}
    {state.loading && <p role="status" className={css.note}>{copy.loading}</p>}
    {state.error && <div><FormError message={formatTmsMutationFailure(state.error, copy.loadError)} /><button type="button" className={css.action} onClick={state.reload}>{copy.retry}</button></div>}
    <ul className={css.list}>{state.items.map((item) => <li key={item.id}>{item.status === "ready" ?
      <AttachmentLink attachmentId={item.id} canRemove={canManage} disposition="attachment" /> :
      <span>{item.originalFilename} · {item.status === "pending" ? copy.pending : copy.unavailable}</span>}</li>)}</ul>
    {state.uploads.map((entry) => <div key={entry.id} className={css.upload}><span>{entry.file.name}</span>
      {entry.phase === "pending" ? <span role="status">{copy.uploading}</span> : <>
        <FormError message={entry.error ? formatTmsMutationFailure(entry.error, copy.failed) : copy.failed} />
        <button type="button" className={css.action} disabled={state.pending || !canManage} onClick={() => state.retry(entry)}>{copy.retry}</button>
        <button type="button" className={css.icon} disabled={state.pending} aria-label={copy.cancel} onClick={() => state.discard(entry.id)}><PiX /></button>
      </>}
    </div>)}
    {state.cursor && <button type="button" className={css.action} disabled={state.loading} onClick={state.loadMore}>{copy.more}</button>}
  </section>;
}
export function OrganizationFilesAfterSave() {
  const { locale } = useTmsLocale(); const copy = organizationAttachmentCopy(locale);
  return <p className={css.afterSave}><PiPaperclip aria-hidden="true" /><span>{copy.attach}<small>{copy.afterSave}</small></span></p>;
}
