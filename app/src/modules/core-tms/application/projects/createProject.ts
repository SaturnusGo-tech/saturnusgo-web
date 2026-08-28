import type {
  Environment,
  Project,
} from "../../../../core/tms/contracts/legacy-contract";
import type { components } from "../../../../core/tms/generated/tms-api";
import {
  toTmsMutationFailure,
  type TmsMutationFailure,
} from "../../../../core/tms/errors/mutation-failure";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createEnvironmentResource } from "../../environments/data/environment-api";
import { createUid } from "../../helpers/id/createUid";
import type { TmsLocale } from "../../localization/model/locale";
import { createProjectResource, updateProjectResource } from "../../projects/data/project-api";

type Result =
  | { ok: true; project: Project; environment: Environment }
  | {
    ok: false;
    reason: "project" | "environment";
    failure: TmsMutationFailure;
  };

export async function createProject(input: {
  http: TmsHttpClient;
  workspaceId: string;
  name: string;
  key: string;
  description: string;
  environmentName: string;
  baseUrl: string;
  offline: boolean;
  locale: TmsLocale;
  operationKey: string;
}): Promise<Result> {
  const normalizedKey = input.key.trim().toUpperCase();
  const projectPayload = {
    workspaceId: input.workspaceId,
    key: normalizedKey,
    name: input.name.trim(),
    description: input.description.trim(),
  } satisfies components["schemas"]["ProjectCreateRequest"];
  if (input.offline) {
    const project: Project = {
      id: createUid("project"),
      key: normalizedKey,
      name: projectPayload.name,
      description: projectPayload.description,
      status: "active",
    };
    return {
      ok: true,
      project,
      environment: {
        id: createUid("env"),
        projectId: project.id,
        key: "LOCAL",
        name: input.environmentName.trim(),
        baseUrl: input.baseUrl.trim(),
        description:
          input.locale === "ru"
            ? "Цель демо-режима разработки"
            : "Development demo target",
        isDefault: true,
        status: "active",
      },
    };
  }
  let project: Project;
  try {
    project = (await createProjectResource(
      input.http,
      projectPayload,
      `${input.operationKey}:project`,
    )).data;
  } catch (error) {
    return { ok: false, reason: "project", failure: toTmsMutationFailure(error) };
  }
  const environmentPayload = {
    projectId: project.id,
    key: "LOCAL",
    name: input.environmentName.trim(),
    baseUrl: input.baseUrl.trim(),
    description:
      input.locale === "ru"
        ? "Локальная цель тестирования по умолчанию"
        : "Default local test target",
    isDefault: true,
  } satisfies components["schemas"]["EnvironmentCreateRequest"];
  let environment: Environment;
  try {
    environment = (await createEnvironmentResource(
      input.http,
      environmentPayload,
      `${input.operationKey}:environment`,
    )).data;
  } catch (error) {
    return { ok: false, reason: "environment", failure: toTmsMutationFailure(error) };
  }
  return { ok: true, project, environment };
}

export async function updateProject(input: {
  http: TmsHttpClient;
  project: Project;
  etag: string | null;
  name: string;
  key: string;
  description: string;
  offline: boolean;
  operationKey: string;
}) {
  const body = {
    name: input.name.trim(),
    description: input.description.trim(),
  } satisfies components["schemas"]["ProjectPatchRequest"];
  if (input.offline) return { data: { ...input.project, ...body }, etag: null };
  if (!input.etag) throw new Error("Project ETag is required for update.");
  return await updateProjectResource(
    input.http, input.project.id, body, input.etag, input.operationKey,
  );
}
