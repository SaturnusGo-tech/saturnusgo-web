import type { Environment } from "../../../../core/tms/contracts/legacy-contract";
import { mutate } from "../../../../core/tms/transport/http";
import { createUid } from "../../helpers/id/createUid";

export async function createEnvironment(input: {
  projectId: string;
  name: string;
  key: string;
  baseUrl: string;
  description: string;
  offline: boolean;
}): Promise<Environment> {
  const payload = {
    projectId: input.projectId,
    name: input.name.trim(),
    key: input.key.trim(),
    baseUrl: input.baseUrl.trim(),
    description: input.description.trim(),
    isDefault: false,
  };
  if (input.offline) return { id: createUid("env"), ...payload };
  try {
    return await mutate<Environment>("/environments", "POST", payload);
  } catch (error) { throw error; }
}
