import type { Environment } from "../../../../core/tms/contracts/legacy-contract";
import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createEnvironmentResource, updateEnvironmentResource } from "../../environments/data/environment-api";
import { createUid } from "../../helpers/id/createUid";

export async function createEnvironment(input: {
  http: TmsHttpClient;
  projectId: string;
  name: string;
  key: string;
  baseUrl: string;
  description: string;
  offline: boolean;
  operationKey: string;
}): Promise<Environment> {
  const payload = {
    projectId: input.projectId,
    name: input.name.trim(),
    key: input.key.trim().toUpperCase(),
    baseUrl: input.baseUrl.trim(),
    description: input.description.trim(),
    isDefault: false,
  } satisfies components["schemas"]["EnvironmentCreateRequest"];
  if (input.offline) return { id: createUid("env"), status: "active", ...payload };
  return (await createEnvironmentResource(input.http, payload, input.operationKey)).data;
}

export async function updateEnvironment(input: {
  http: TmsHttpClient;
  environment: Environment;
  etag: string | null;
  name: string;
  key: string;
  baseUrl: string;
  description: string;
  offline: boolean;
  operationKey: string;
}) {
  const body = {
    name: input.name.trim(), key: input.key.trim().toUpperCase(),
    baseUrl: input.baseUrl.trim(), description: input.description.trim(),
  } satisfies components["schemas"]["EnvironmentPatchRequest"];
  if (input.offline) return { data: { ...input.environment, ...body }, etag: null };
  if (!input.etag) throw new Error("Environment ETag is required for update.");
  return await updateEnvironmentResource(
    input.http, input.environment.id, body, input.etag, input.operationKey,
  );
}
