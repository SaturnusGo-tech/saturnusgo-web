import { Input } from "@heroui/react";
import { LoaderCircle } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type MutableRefObject } from "react";
import { DefectPageHost } from "./page/DefectPageHost";
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
  return <DefectPageHost onNavigate={props.onClose} pending={submitting}>
    <section className={`${css.panel} ${closing ? css.closing : ""}`} data-defect-page aria-labelledby={`${id}-heading`}
      onKeyDown={event => { if (event.key === "Escape" && !event.defaultPrevented && !submitting && !closing) { event.preventDefault(); props.onClose(); } }}
      ref={element => { props.panelRef.current = element; }}>
      <header><div><h1 id={`${id}-heading`}>{copy.title}</h1>{props.context && <p>{props.context}</p>}</div>
        <div className={css.actions}><button type="button" className={css.cancel} disabled={submitting || closing} onClick={props.onClose}>{copy.cancel}</button>
          <button className={css.save} type="submit" form={id} disabled={submitting || closing}
            data-testid="create-defect">{submitting && <LoaderCircle className={css.spinner} size={16}/>} {submitting ? copy.creating : copy.create}</button></div>
      </header>
    <form id={id} className={css.form} onSubmit={submit} noValidate aria-busy={submitting}
      data-testid={value.reproduction !== undefined ? "inline-defect-composer" : "defect-composer"}
      ref={element => { if (element) element.inert = closing || submitting; }}>
      <div className={css.body}>
        <div className={css.titleField}>
          <Input id={`${id}-title`} ref={titleRef} data-autofocus data-testid="defect-title" autoFocus
            aria-label={copy.summary} value={value.title} onValueChange={title => onChange({ title })}
            classNames={{ inputWrapper: `${css.fieldShell} ${css.titleShell}`, input: `${css.fieldInput} ${css.titleInput}` }}
            placeholder={ru ? "Название дефекта" : "Defect title"} aria-required="true"
            isInvalid={Boolean(errors.title)} aria-describedby={errors.title ? `${id}-title-error` : undefined} />
          {errors.title && <small id={`${id}-title-error`} className={css.validation} role="alert">{errors.title}</small>}
        </div>
        <div className={css.layout}>
          <div className={css.content}>
            <NarrativeField label={copy.description} value={value.description} framed error={errors.description}
              onChange={description => onChange({ description })} disabled={submitting} />
            {value.reproduction !== undefined && <NarrativeField label={ru ? "Шаги воспроизведения" : "Steps to reproduce"}
              value={value.reproduction} framed error={errors.reproduction}
              onChange={reproduction => onChange({ reproduction })} disabled={submitting} />}
            <NarrativeField label={copy.actual} value={value.actualResult} framed error={errors.actualResult}
              onChange={actualResult => onChange({ actualResult })} disabled={submitting} />
            <NarrativeField label={copy.expected} value={value.expectedResult} framed
              onChange={expectedResult => onChange({ expectedResult })} disabled={submitting} />
            <DefectEvidence files={props.files} onChange={props.onFilesChange} disabled={submitting} />
            <DefectProperties workspaceId={props.workspaceId} offline={props.offline} disabled={submitting}
              value={value} onChange={onChange} components={props.components} routing={routing} showRoutingError={attempted} />
          </div>
        </div>
        {props.error && <FormError message={props.error} />}
      </div>
    </form>
    </section>
  </DefectPageHost>;
}
