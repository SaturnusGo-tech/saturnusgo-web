import { useFormLeave } from "../../../authoring/leave/state/value/useFormLeave";
import { DefectForm } from "../../dialogs/defect-form/DefectForm";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Defect, RunItem, TestRunSummary, TestStep } from "../../../../../core/tms/contracts/legacy-contract";
import { createDefect } from "../../../application/defects/createDefect";
import { describeDefectCreateError } from "../../../application/defects/describeDefectCreateError";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { defectClientLabels, inferLegacyDefectIntegrationTarget, resolveDefectIntegrationChoice, type DefectIntegrationChoice } from "../../../defects/model/integration-target";
import { useYouTrackRouteOptions } from "../../../defects/presentation/use-youtrack-route-options";
import { defectRouteChoices } from "../../../defects/presentation/defect-route-choices";
import { executableSteps } from "../../../helpers/cases/caseRevision";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel } from "../../../localization/format/labels";
import { getDefectDialogCopy } from "../../dialogs/defect/copy";
import { useDrawerDismiss } from "../../common/drawer/useDrawerDismiss";

type Props = {
  workspaceId: string;
  projectId: string;
  run: TestRunSummary;
  item: RunItem;
  step: TestStep;
  components: string[];
  offline: boolean;
  onClose: () => void;
  onCreated: (defect: Defect) => void;
};

export function InlineDefectComposer({ workspaceId, projectId, run, item, step, components, offline, onClose, onCreated }: Props) {
  const http = useTmsHttpClient();
  const attachments = useAttachmentClient();
  const { locale, t } = useTmsLocale();
  const copy = getDefectDialogCopy(locale);
  const { closing, dismiss, panelRef } = useDrawerDismiss();
  const youTrack = useYouTrackRouteOptions(workspaceId, locale);
  const attempt = item.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo) ?? item.attempts[0];
  const localizedStep = executableSteps(item.snapshot, locale).find((entry) => entry.id === step.id) ?? step;
  const failedResult = attempt?.stepResults.find((entry) => entry.stepId === step.id);
  const observed = failedResult?.actualResult || attempt?.actualResult || t("inlineDefect.observedDefault");
  const componentOptions = Array.from(new Set([item.snapshot.component, ...components].map((value) => value.trim()).filter(Boolean)));
  if (componentOptions.length === 0) componentOptions.push("Core product");
  const [title, setTitle] = useState(observed);
  const [actual, setActual] = useState(observed);
  const [expected, setExpected] = useState(localizedStep.expectedResult);
  const [reproducibility, setReproducibility] = useState("Always");
  const [assigneeIdentityId, setAssignee] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Defect["severity"]>("high");
  const [priority, setPriority] = useState<Defect["priority"]>("high");
  const [component, setComponent] = useState(componentOptions[0]);
  const [integrationChoice, setIntegrationChoice] = useState<DefectIntegrationChoice>("");
  const [editedRoute, setEditedRoute] = useState<{ initial: string; value: string } | null>(null);
  const { configurationVersion, enabled, options: youTrackOptions, status: youTrackStatus } = youTrack;
  useEffect(() => {
    if (configurationVersion !== 1 || !enabled || integrationChoice) return;
    const suggested = inferLegacyDefectIntegrationTarget(item.snapshot.tags, item.snapshot.component);
    if (suggested && youTrackOptions.some((option) => option.value === suggested)) setIntegrationChoice(suggested);
  }, [configurationVersion, enabled, integrationChoice, item, youTrackOptions]);
  const routing = resolveDefectIntegrationChoice(
    integrationChoice, offline || (youTrackStatus === "ready" && (configurationVersion === 2 || !enabled)),
  );
  const routeOptions = offline ? [{ value: "", label: copy.projectIntegrations }]
    : youTrackStatus === "loading" ? [{ value: "", label: copy.youTrackLoading }]
    : youTrackStatus === "error" ? [{ value: "", label: copy.youTrackUnavailable }]
    : defectRouteChoices(youTrack, copy);
  const routingMessage = youTrackStatus === "error" ? copy.youTrackUnavailable
    : youTrackStatus === "loading" ? copy.youTrackLoading : copy.youTrackRequired;
  const [description, setDescription] = useState(t("inlineDefect.descriptionDefault", { action: step.action }));
  const [preconditions, setPreconditions] = useState(item.snapshot.preconditions ?? "");
  const [testData, setTestData] = useState(item.snapshot.testData ?? "");
  const [link, setLink] = useState(/^https:\/\//i.test(run.environment.baseUrl) ? run.environment.baseUrl : "");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [operationKey] = useState(() => crypto.randomUUID());

  const value = { title, description, preconditions, testData, actualResult: actual, expectedResult: expected,
    component, severity, priority, reproducibility, assigneeIdentityId, link };
  const leave = useFormLeave(value, { busy: submitting,
    revision: [editedRoute?.value, files.map(file => [file.name, file.size, file.type, file.lastModified])],
    extraDirty: files.length > 0 || Boolean(editedRoute && editedRoute.initial !== editedRoute.value) });
  const changeRoute = (next: DefectIntegrationChoice) => {
    setEditedRoute(current => ({ initial: current?.initial ?? integrationChoice, value: next }));
    setIntegrationChoice(next);
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!description.trim()) { setError(locale === "ru" ? "Добавьте описание дефекта." : "Add a defect description."); return; }
    if (!routing.resolved) { setError(copy.youTrackRequired); return; }
    setSubmitting(true);
    setError("");
    const payload: Omit<Defect, "id" | "key" | "createdAt" | "attachmentIds" | "linkIds" | "externalIssue"> = {
      projectId, title, description,
      preconditions, testData, severity, priority, status: "open", reproducibility, assigneeIdentityId,
      component, integrationTarget: routing.target,
      labels: defectClientLabels(true), runId: run.id, runItemId: item.id,
      stepId: step.id, expectedResult: expected, actualResult: actual,
    };
    try {
      const next = await createDefect({ http, attachments, projectId, payload, files, operationKey, link, offline, locale });
      leave.release();
      dismiss(() => { onCreated(next); onClose(); });
    } catch (caught) {
      setError(describeDefectCreateError(caught, t("inlineDefect.saveError"), locale));
      setSubmitting(false);
    }
  }

  const componentChoices = componentOptions.map((value) => ({ value, label: localizedComponentLabel(locale, value) }));
  return <DefectForm workspaceId={workspaceId} offline={offline} runOccurrence
    context={`${item.caseKey} · ${t("inlineDefect.linkStep")} ${step.order} · ${run.environment.name}`}
    value={value}
    onChange={patch => {
      if (patch.title !== undefined) setTitle(patch.title);
      if (patch.description !== undefined) setDescription(patch.description);
      if (patch.preconditions !== undefined) setPreconditions(patch.preconditions);
      if (patch.testData !== undefined) setTestData(patch.testData);
      if (patch.actualResult !== undefined) setActual(patch.actualResult);
      if (patch.expectedResult !== undefined) setExpected(patch.expectedResult);
      if (patch.component !== undefined) setComponent(patch.component);
      if (patch.severity !== undefined) setSeverity(patch.severity);
      if (patch.priority !== undefined) setPriority(patch.priority);
      if (patch.reproducibility !== undefined) setReproducibility(patch.reproducibility);
      if (patch.assigneeIdentityId !== undefined) setAssignee(patch.assigneeIdentityId);
      if (patch.link !== undefined) setLink(patch.link);
    }}
    components={componentChoices}
    routing={{ value: integrationChoice, onChange: changeRoute, options: routeOptions,
      disabled: offline || youTrackStatus !== "ready", resolved: routing.resolved, message: routingMessage }}
    files={files} onFilesChange={setFiles} submitting={submitting} error={error}
    closing={closing} panelRef={panelRef} onSubmit={submit}
    onClose={() => { if (!submitting) void leave.close(() => dismiss(onClose)); }} />;
}
