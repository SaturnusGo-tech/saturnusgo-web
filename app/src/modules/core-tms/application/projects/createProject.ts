import type {
  Environment,
  Project,
} from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createUid } from "../../helpers/id/createUid";
import type { TmsLocale } from "../../localization/model/locale";

type Result =
  | { ok: true; project: Project; environment: Environment }
  | { ok: false; reason: "project" | "environment" | "rollback" };

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
}): Promise<Result> {
  const normalizedKey = input.key.trim().toUpperCase();
  const projectPayload = {
    workspaceId: input.workspaceId,
    key: normalizedKey,
    name: input.name.trim(),
    slug: input.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    description: input.description.trim(),
  };
  if (input.offline) {
    const project: Project = {
      id: createUid("project"),
      key: normalizedKey,
      name: projectPayload.name,
      description: projectPayload.description,
    };
    return {
      ok: true,
      project,
      environment: {
        id: createUid("env"),
        projectId: project.id,
        key: "local",
        name: input.environmentName.trim(),
        baseUrl: input.baseUrl.trim(),
        description:
          input.locale === "ru"
            ? "Цель демо-режима разработки"
            : "Development demo target",
        isDefault: true,
      },
    };
  }
  let project: Project;
  let projectPersisted = false;
  try {
    project = await input.http.mutate<Project>("/projects", "POST", projectPayload);
    projectPersisted = true;
  } catch {
    return { ok: false, reason: "project" };
  }
  const environmentPayload = {
    projectId: project.id,
    key: "local",
    name: input.environmentName.trim(),
    baseUrl: input.baseUrl.trim(),
    description:
      input.locale === "ru"
        ? "Локальная цель тестирования по умолчанию"
        : "Default local test target",
    isDefault: true,
  };
  let environment: Environment;
  try {
    environment = await input.http.mutate<Environment>(
      "/environments",
      "POST",
      environmentPayload,
    );
  } catch {
    if (projectPersisted) {
      try {
        await input.http.mutate(`/projects/${project.id}`, "DELETE");
      } catch {
        return { ok: false, reason: "rollback" };
      }
    }
    return { ok: false, reason: "environment" };
  }
  return { ok: true, project, environment };
}
