import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { useEffect, useId, useRef, useState, type FormEvent, type MutableRefObject } from "react";
import { Modal } from "../../common/modal/Modal";
import { FormError } from "../../common/error/FormError";
import { CreationNarrativeSection } from "../../cases/inspector/creation/CreationNarrativeSection";
import inspector from "../../cases/inspector/caseInspector.module.css";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { getDefectDialogCopy } from "../defect/copy";
import { DefectProperties } from "./properties/DefectProperties";
import { DefectEvidence } from "./evidence/DefectEvidence";
import { useDefectFileTransfer } from "./evidence/transfer/useDefectFileTransfer";
import { DefectResults } from "./results/DefectResults";
import { validateDefectDraft } from "./validation/validateDefectDraft";
import type { DefectDraft, DefectDraftErrors, DefectRouting, DefectTraceabilityChoices } from "./model";
import { DefectSharedReproduction } from "./reproduction/DefectSharedReproduction";
import css from "./form.module.css";

type Props = {
  workspaceId: string; offline: boolean; context?: string;
  traceability?: DefectTraceabilityChoices; runOccurrence?: boolean;
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
  const evidence = useDefectFileTransfer(props.files, props.onFilesChange, submitting || closing);
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
      onPasteCapture={evidence.onPasteCapture} onDropCapture={evidence.onDropCapture}
      onDragOverCapture={evidence.onDragOverCapture} onDragEnterCapture={evidence.onDragEnterCapture}
      onDragLeaveCapture={evidence.onDragLeaveCapture} onDragEndCapture={evidence.onDragEndCapture}
      data-defect-drawer
      data-testid={props.runOccurrence ? "inline-defect-composer" : "defect-composer"}
      ref={element => { props.panelRef.current = element?.parentElement ?? null; if (element) element.inert = closing; }}>
        <div className={`${inspector.creationHeader} ${css.titleField}`}>
          <div className={css.titleShell} data-input-shell data-invalid={Boolean(errors.title)}>
          <input id={`${id}-title`} ref={titleRef} data-autofocus data-testid="defect-title" autoFocus
            aria-label={copy.summary} value={value.title} onChange={event => onChange({ title: event.target.value })}
            className={`${inspector.titleInput} ${css.titleInput}`} disabled={submitting}
            placeholder={ru ? "Название дефекта" : "Defect title"} aria-required="true"
            aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${id}-title-error` : undefined} />
          </div>
          {errors.title && <small id={`${id}-title-error`} className={css.validation} role="alert">{errors.title}</small>}
        </div>
      <div className={css.body}>
        <div className={css.layout} data-defect-create-layout>
          <main className={css.content}>
          <fieldset className={inspector.primaryColumn} disabled={submitting}
            ref={element => { if (element) element.inert = submitting; }}>
            <CreationNarrativeSection section="description" hideEdit allowAttachments={false} title={copy.description} value={value.description} error={errors.description} ru={ru}
              onChange={description => onChange({ description })} disabled={submitting} />
            <CreationNarrativeSection section="preconditions" hideEdit allowAttachments={false} title={ru ? "Предусловия" : "Preconditions"}
              value={value.preconditions} ru={ru} onChange={preconditions => onChange({ preconditions })} disabled={submitting} />
            <CreationNarrativeSection section="testData" hideEdit allowAttachments={false} title={ru ? "Тестовые данные" : "Test data"}
              value={value.testData} ru={ru} onChange={testData => onChange({ testData })} disabled={submitting} />
            {props.traceability && !props.runOccurrence && <DefectSharedReproduction
              value={value.reproductionSharedSteps ?? []} choices={props.traceability} ru={ru} disabled={submitting}
              onChange={reproductionSharedSteps => onChange({ reproductionSharedSteps })} />}
            <DefectResults ru={ru} actual={value.actualResult} expected={value.expectedResult} error={errors.actualResult}
              onActualChange={actualResult => onChange({ actualResult })}
              onExpectedChange={expectedResult => onChange({ expectedResult })} />
            <DefectEvidence files={props.files} onChange={evidence.changeFiles} onAdd={evidence.addFiles}
              disabled={submitting || closing} dragging={evidence.dragging} limitExceeded={evidence.limitExceeded} />
          </fieldset>
          </main>
          <DefectProperties workspaceId={props.workspaceId} offline={props.offline} disabled={submitting}
              value={value} onChange={onChange} components={props.components} routing={routing} showRoutingError={attempted} traceability={props.traceability} />
        </div>
        {props.error && <FormError message={props.error} />}
      </div>
      <footer className={`${inspector.createActions} ${inspector.creationFooter} ${css.actions}`}>
        <button type="button" disabled={submitting || closing} onClick={props.onClose}>{copy.cancel}</button>
        <button type="submit" disabled={submitting || closing}
          data-testid="create-defect">{submitting && <LoadingOrb />} {submitting ? copy.creating : copy.create}</button>
      </footer>
    </form>
  </Modal>;
}
