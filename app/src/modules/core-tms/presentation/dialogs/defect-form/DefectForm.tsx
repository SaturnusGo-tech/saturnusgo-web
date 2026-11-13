import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { useEffect, useId, useRef, useState, type FormEvent, type MutableRefObject } from "react";
import { Modal } from "../../common/modal/Modal";
import { FormError } from "../../common/error/FormError";
import { NarrativeField } from "../../cases/inspector/markdown/plain/NarrativeField";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { getDefectDialogCopy } from "../defect/copy";
import { DefectProperties } from "./properties/DefectProperties";
import { DefectEvidence } from "./evidence/DefectEvidence";
import { validateDefectDraft } from "./validation/validateDefectDraft";
import type { DefectDraft, DefectDraftErrors, DefectRouting } from "./model";
import css from "./form.module.css";

type Props = {
  workspaceId: string; offline: boolean; context?: string;
  value: DefectDraft; onChange: (patch: Partial<DefectDraft>) => void;
  components: { value: string; label: string }[]; routing: DefectRouting;
  files: File[]; onFilesChange: (files: File[]) => void;
  submitting: boolean; error: string; closing: boolean; panelRef: MutableRefObject<HTMLElement | null>;
  onSubmit: (event: FormEvent) => void; onClose: () => void;
};
export function DefectForm(props: Props) {
  const { value, onChange, submitting, closing, routing } = props;
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const copy = getDefectDialogCopy(locale);
  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [attempted, setAttempted] = useState(false);
  useEffect(() => { void import("../../cases/inspector/markdown/InitializedMarkdownEditor").catch(() => undefined); }, []);
  const errors: DefectDraftErrors = attempted ? validateDefectDraft(value, ru) : {};
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (submitting || closing) return;
    setAttempted(true);
    const next = validateDefectDraft(value, ru);
    if (Object.keys(next).length) { if (next.title) titleRef.current?.focus(); return; }
    props.onSubmit(event);
  };
  return <Modal title={copy.title} subtitle={props.context} drawer wide onClose={props.onClose}
    panelClassName={`${css.panel} ${closing ? css.closing : ""}`}>
    <form id={id} className={css.form} onSubmit={submit} noValidate aria-busy={submitting}
      data-defect-drawer
      data-testid={value.reproduction !== undefined ? "inline-defect-composer" : "defect-composer"}
      ref={element => { props.panelRef.current = element?.parentElement ?? null; if (element) element.inert = closing; }}>
      <div className={css.body}>
        <div className={css.titleField}>
          <div className={css.titleShell} data-input-shell data-invalid={Boolean(errors.title)}>
          <input id={`${id}-title`} ref={titleRef} data-autofocus data-testid="defect-title" autoFocus
            aria-label={copy.summary} value={value.title} onChange={event => onChange({ title: event.target.value })}
            className={css.titleInput} disabled={submitting}
            placeholder={ru ? "Название дефекта" : "Defect title"} aria-required="true"
            aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${id}-title-error` : undefined} />
          </div>
          {errors.title && <small id={`${id}-title-error`} className={css.validation} role="alert">{errors.title}</small>}
        </div>
        <div className={css.layout} data-defect-create-layout>
          <main className={css.content}>
            <NarrativeField framed label={copy.description} value={value.description} error={errors.description}
              onChange={description => onChange({ description })} disabled={submitting} />
            {value.reproduction !== undefined && <NarrativeField framed label={ru ? "Шаги воспроизведения" : "Steps to reproduce"}
              value={value.reproduction} error={errors.reproduction}
              onChange={reproduction => onChange({ reproduction })} disabled={submitting} />}
            <NarrativeField framed label={copy.actual} value={value.actualResult} error={errors.actualResult}
              onChange={actualResult => onChange({ actualResult })} disabled={submitting} />
            <NarrativeField framed label={copy.expected} value={value.expectedResult}
              onChange={expectedResult => onChange({ expectedResult })} disabled={submitting} />
            <DefectEvidence files={props.files} onChange={props.onFilesChange} disabled={submitting} />
          </main>
          <DefectProperties workspaceId={props.workspaceId} offline={props.offline} disabled={submitting}
              value={value} onChange={onChange} components={props.components} routing={routing} showRoutingError={attempted} />
        </div>
        {props.error && <FormError message={props.error} />}
      </div>
      <footer className={css.actions}>
        <button type="button" className={css.cancel} disabled={submitting || closing} onClick={props.onClose}>{copy.cancel}</button>
        <button className={css.save} type="submit" disabled={submitting || closing}
          data-testid="create-defect">{submitting && <LoadingOrb />} {submitting ? copy.creating : copy.create}</button>
      </footer>
    </form>
  </Modal>;
}
