import type { Suite } from "../../../../core/tms/contracts/legacy-contract";
import { mutate } from "../../../../core/tms/transport/http";
import { createUid } from "../../helpers/id/createUid";

export async function saveSuite(input: {
  suite?: Suite;
  projectId: string;
  name: string;
  description: string;
  type: Suite["type"];
  caseIds: string[];
  tags: string[];
  offline: boolean;
}): Promise<Suite> {
  const filter = input.type === "dynamic" ? { tags: input.tags } : {};
  const payload = {
    projectId: input.projectId,
    name: input.name.trim(),
    description: input.description.trim(),
    type: input.type,
    caseIds: input.type === "static" ? input.caseIds : [],
    filter,
  };
  if (input.offline) {
    return {
      id: input.suite?.id ?? createUid("suite"),
      projectId: input.projectId,
      key: input.suite?.key ?? `TS-${Date.now().toString().slice(-4)}`,
      name: payload.name,
      description: payload.description,
      type: input.type,
      caseIds: payload.caseIds,
      filter,
      status: input.suite?.status ?? "active",
    };
  }
  try {
    return await mutate<Suite>(
      input.suite ? `/suites/${input.suite.id}` : "/suites",
      input.suite ? "PATCH" : "POST",
      payload,
    );
  } catch (error) { throw error; }
}
