import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { TestDataPort } from "../../application/ports/test-data-port";
import { createDatasetClient } from "../datasets/dataset-client";
import { createCredentialClient } from "../credentials/credential-client";
import { createExecutionDataClient } from "../execution/execution-client";
import { createUsageClient } from "../usage/usage-client";
export function createTestDataClient(http: TmsHttpClient, base: string, workspaceId: string, projectId: string): TestDataPort {
  return { ...createDatasetClient(http, base), ...createCredentialClient(http, base, workspaceId, projectId), ...createExecutionDataClient(http, projectId),
    usage: createUsageClient(http, base) };
}
