import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { ProductDocsApi, ProductDocScope } from "../domain/product-docs";

type Contract = components["schemas"];

function endpoint(scope: ProductDocScope): string {
  return `/workspaces/${encodeURIComponent(scope.workspaceId)}/projects/${encodeURIComponent(scope.projectId)}/product-docs`;
}

function query(options?: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options ?? {})) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      params.set(key, String(value));
    }
  }
  return params.size ? `?${params}` : "";
}

const docPath = (scope: ProductDocScope, id: string) => `${endpoint(scope)}/${encodeURIComponent(id)}`;
const caseRequirements = (scope: ProductDocScope, caseId: string) =>
  `${endpoint(scope)}/cases/${encodeURIComponent(caseId)}/requirements`;

export function createProductDocsApi(http: TmsHttpClient): ProductDocsApi {
  async function read<T>(path: string, signal?: AbortSignal): Promise<T> {
    return (await http.getResource<T>(path, signal)).data;
  }
  return {
    async availability(scope, signal) {
      return (await read<Contract["ProductDocAvailability"]>(`${endpoint(scope)}/availability`, signal)).enabled;
    },
    list: (scope, options) => read<Contract["ProductDocList"]>(endpoint(scope) + query(options), options?.signal),
    get: (scope, id, options) => read<Contract["ProductDocDetail"]>(docPath(scope, id) + query(options), options?.signal),
    async create(scope, input, options) {
      return (await http.mutateResource<Contract["ProductDocCreated"]>(
        endpoint(scope), "POST", input satisfies Contract["ProductDocCreateInput"], options,
      )).data;
    },
    save: (scope, id, input) => http.mutate<Contract["ProductDocDraftVersion"]>(
      docPath(scope, id), "PUT", input satisfies Contract["ProductDocSaveInput"],
    ),
    publish: (scope, id, input) => http.mutate<Contract["ProductDocPublished"]>(
      docPath(scope, id) + "/publish", "POST", input satisfies Contract["ProductDocPublishInput"],
    ),
    move: (scope, id, input) => http.mutate<Contract["ProductDocDraftVersion"]>(
      docPath(scope, id) + "/location", "PATCH", input satisfies Contract["ProductDocMoveInput"],
    ),
    listArticleCases: (scope, id, options) => read<Contract["ProductDocArticleCases"]>(
      docPath(scope, id) + "/cases" + query(options), options?.signal,
    ),
    listCaseRequirements: (scope, caseId, options) => read<Contract["ProductDocRequirements"]>(
      caseRequirements(scope, caseId) + query(options), options?.signal,
    ),
    listRunRequirements: (scope, runId, itemId, options) => read<Contract["ProductDocRequirements"]>(
      `${endpoint(scope)}/runs/${encodeURIComponent(runId)}/items/${encodeURIComponent(itemId)}/requirements${query(options)}`,
      options?.signal,
    ),
    linkRequirement: (scope, caseId, docId, sectionId) => http.mutate<Contract["ProductDocLinkResult"]>(
      `${caseRequirements(scope, caseId)}/${encodeURIComponent(docId)}`, "PUT", {sectionId} satisfies Contract["ProductDocLinkInput"],
    ),
    unlinkRequirement: (scope, caseId, docId) => http.mutate<Contract["ProductDocLinkResult"]>(
      `${caseRequirements(scope, caseId)}/${encodeURIComponent(docId)}`, "DELETE",
    ),
  };
}
