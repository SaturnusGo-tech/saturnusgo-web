import type { components } from "../../../../core/tms/generated/tms-api";
import type { Defect } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { PrivateAttachmentClient } from "../../attachments/application/private-attachment-client";
import { createDefectResource, getDefect } from "../../defects/data/defect-api";
import { createExternalLinkResource } from "../../external-links/data/external-link-api";
import { uploadEvidence } from "../evidence/uploadEvidence";
import { createUid } from "../../helpers/id/createUid";
import type { TmsLocale } from "../../localization/model/locale";

type DefectPayload = Omit<Defect,
  "id" | "key" | "createdAt" | "attachmentIds" | "linkIds" | "externalIssue">;

export async function createDefect(input: {
  http: TmsHttpClient;
  attachments: PrivateAttachmentClient;
  projectId: string;
  payload: DefectPayload;
  files: File[];
  operationKey: string;
  link?: string;
  offline: boolean;
  locale: TmsLocale;
}): Promise<Defect> {
  const targetUri = input.link?.trim() || null;
  if (targetUri && !/^https:\/\//i.test(targetUri) && !/^[a-z][a-z0-9+.-]*:\/\//.test(targetUri)) {
    throw new Error("External links require HTTPS or a valid deep-link scheme.");
  }
  if (targetUri && /^http:\/\//i.test(targetUri)) throw new Error("External links require HTTPS.");
  if (input.offline) {
    return {
      id: createUid("defect"),
      key: `BUG-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      attachmentIds: [],
      linkIds: [],
      externalIssue: null,
      ...input.payload,
    };
  }
  const body = {
    projectId: input.payload.projectId,
    title: input.payload.title,
    description: input.payload.description,
    severity: input.payload.severity,
    priority: input.payload.priority,
    reproducibility: input.payload.reproducibility,
    assigneeIdentityId: input.payload.assigneeIdentityId,
    component: input.payload.component,
    integrationTarget: input.payload.integrationTarget,
    labels: input.payload.labels,
    runId: input.payload.runId,
    runItemId: input.payload.runItemId,
    stepId: input.payload.stepId,
    expectedResult: input.payload.expectedResult,
    actualResult: input.payload.actualResult,
  } satisfies components["schemas"]["DefectCreateRequest"];
  const created = await createDefectResource(input.http, body, input.operationKey);
  if (input.files.length > 0) {
    await uploadEvidence({
      client: input.attachments,
      projectId: input.projectId,
      owner: { kind: "defect", defectId: created.data.id },
      files: input.files,
      operationKeyPrefix: input.operationKey,
    });
  }
  if (targetUri) {
    const body = {
      projectId: input.projectId,
      owner: { kind: "defect", defectId: created.data.id },
      label: input.locale === "ru" ? "Ссылка на дефект" : "Defect link",
      targetUri,
      kind: /^https:\/\//i.test(targetUri) ? "url" : "deep_link",
    } satisfies components["schemas"]["ExternalLinkCreateRequest"];
    await createExternalLinkResource(input.http, body, `${input.operationKey}:link`);
  }
  return (await getDefect(input.http, created.data.id)).data;
}
