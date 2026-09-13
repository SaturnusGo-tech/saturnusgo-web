import { DefectForm } from "../defect-form/DefectForm";
import { useEffect, useState, type FormEvent } from "react";
import type { Defect, RunItem, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { createDefect } from "../../../application/defects/createDefect";
import { describeDefectCreateError } from "../../../application/defects/describeDefectCreateError";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { executableSteps } from "../../../helpers/cases/caseRevision";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedComponentLabel } from "../../../localization/format/labels";
import { defectClientLabels, inferLegacyDefectIntegrationTarget, resolveDefectIntegrationChoice, type DefectIntegrationChoice } from "../../../defects/model/integration-target";
import { useYouTrackRouteOptions } from "../../../defects/presentation/use-youtrack-route-options";
import { defectRouteChoices } from "../../../defects/presentation/defect-route-choices";
import { getDefectDialogCopy } from "./copy";
import { useDrawerDismiss } from "../../common/drawer/useDrawerDismiss";
type DefectDialogProps = {
  workspaceId: string; projectId: string; run: TestRunSummary | null; item: RunItem | null; components: string[];
  offline: boolean; onClose: () => void; onCreated: (defect: Defect) => void;
};
export function DefectDialog({ workspaceId, projectId, run, item, components, offline, onClose,
  onCreated }: DefectDialogProps) {
  const http = useTmsHttpClient();
  const attachments = useAttachmentClient();
  const { locale } = useTmsLocale();
  const copy = getDefectDialogCopy(locale);
  const { closing, dismiss, panelRef } = useDrawerDismiss();
  const youTrack = useYouTrackRouteOptions(workspaceId, locale);
  const occurrence = run && item ? { run, item } : null;
  const attempt = item?.attempts.find((entry) => entry.attemptNo === item.activeAttemptNo) ?? item?.attempts[0];
  const failedStep = item
    ? executableSteps(item.snapshot, locale).find(
        (step) =>
          attempt?.stepResults.find((result) => result.stepId === step.id)
            ?.status === "failed",
      )
    : undefined;
  const fallbackComponent = locale === "ru" ? "Основной продукт" : "Core product";
  const projectComponents = Array.from(new Set([
    item?.snapshot.component,
    ...components,
  ].map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
  const componentOptions = projectComponents.length > 0 ? projectComponents : [fallbackComponent];
  const localizedComponentOptions = componentOptions.map((value) => ({
    value,
    label: localizedComponentLabel(locale, value),
  }));
  const [title, setTitle] = useState(
    item
      ? `${item.snapshot.title} ${copy.failsOn} ${run?.environment.name ?? copy.testEnvironment}`
      : "",
  );
  const [description, setDescription] = useState(item?.snapshot.description ?? "");
  const [actual, setActual] = useState(
    attempt?.actualResult ?? "",
  );
  const [expected, setExpected] = useState(failedStep?.expectedResult ?? "");
  const [priority, setPriority] = useState<Defect["priority"]>("high");
  const [assigneeIdentityId, setAssignee] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Defect["severity"]>("high");
  const [reproducibility, setReproducibility] = useState("Always");
  const [component, setComponent] = useState(componentOptions[0] ?? fallbackComponent);
  const [integrationChoice, setIntegrationChoice] = useState<DefectIntegrationChoice>("");
  const { configurationVersion, enabled, options: youTrackOptions, status: youTrackStatus } = youTrack;
  useEffect(() => {
    if (configurationVersion !== 1 || !enabled || integrationChoice) return;
    const suggested = inferLegacyDefectIntegrationTarget(
      item?.snapshot.tags ?? [], item?.snapshot.component ?? component,
    );
    if (suggested && youTrackOptions.some((option) => option.value === suggested)) setIntegrationChoice(suggested);
  }, [component, configurationVersion, enabled, integrationChoice, item, youTrackOptions]);
  const automaticRouting = offline || (youTrackStatus === "ready" && (configurationVersion === 2 || !enabled));
  const routing = resolveDefectIntegrationChoice(integrationChoice, automaticRouting);
  const routeOptions = offline ? [{ value: "", label: copy.projectIntegrations }]
    : youTrackStatus === "loading" ? [{ value: "", label: copy.youTrackLoading }]
    : youTrackStatus === "error" ? [{ value: "", label: copy.youTrackUnavailable }]
    : defectRouteChoices(youTrack, copy);
  const routingMessage = youTrackStatus === "error" ? copy.youTrackUnavailable
    : youTrackStatus === "loading" ? copy.youTrackLoading : copy.youTrackRequired;
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [operationKey] = useState(() => crypto.randomUUID());
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!routing.resolved) { setError(copy.youTrackRequired); return; }
    setSubmitting(true);
    setError("");
    const payload: Omit<Defect,
      "id" | "key" | "createdAt" | "attachmentIds" | "linkIds" | "externalIssue"> = {
      projectId,
      title,
      description,
      severity,
      priority,
      status: "open",
      reproducibility,
      assigneeIdentityId,
      component,
      integrationTarget: routing.target,
      labels: defectClientLabels(occurrence !== null),
      runId: occurrence?.run.id ?? null,
      runItemId: occurrence?.item.id ?? null,
      stepId: failedStep?.id ?? null,
      expectedResult: expected,
      actualResult: actual,
    };
    try {
      const created = await createDefect({ http, attachments, projectId, payload, files, operationKey, link, offline, locale });
      dismiss(() => onCreated(created));
    } catch (caught) {
      setError(describeDefectCreateError(caught, copy.error, locale));
      setSubmitting(false);
    }
  }
  return <DefectForm workspaceId={workspaceId} offline={offline}
    context={item ? `${item.caseKey} · ${run?.name} · ${run?.environment.name}` : undefined}
    value={{ title, description, actualResult: actual, expectedResult: expected, component, severity, priority,
      reproducibility, assigneeIdentityId, link }}
    onChange={patch => {
      if (patch.title !== undefined) setTitle(patch.title);
      if (patch.description !== undefined) setDescription(patch.description);
      if (patch.actualResult !== undefined) setActual(patch.actualResult);
      if (patch.expectedResult !== undefined) setExpected(patch.expectedResult);
      if (patch.component !== undefined) setComponent(patch.component);
      if (patch.severity !== undefined) setSeverity(patch.severity);
      if (patch.priority !== undefined) setPriority(patch.priority);
      if (patch.reproducibility !== undefined) setReproducibility(patch.reproducibility);
      if (patch.assigneeIdentityId !== undefined) setAssignee(patch.assigneeIdentityId);
      if (patch.link !== undefined) setLink(patch.link);
    }}
    components={localizedComponentOptions}
    routing={{ value: integrationChoice, onChange: setIntegrationChoice, options: routeOptions,
      disabled: offline || youTrackStatus !== "ready", resolved: routing.resolved, message: routingMessage }}
    files={files} onFilesChange={setFiles} submitting={submitting} error={error}
    closing={closing} panelRef={panelRef} onSubmit={submit}
    onClose={() => { if (!submitting) dismiss(onClose); }} />;
}
