import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { WorkspaceDataPort } from "../../../application/ports/workspace-data-port";
import { createSourceClient } from "../sources/source-client";
import { createWorkspaceCatalogClient } from "../catalog/workspace-catalog-client";
import { createStaticResourceClient } from "../static/static-resource-client";
import { readSourceImportFile } from "../../source-import/read-source-import-file";
export function createWorkspaceDataClient(http: TmsHttpClient, base: string): WorkspaceDataPort {
  return { ...createSourceClient(http, base), ...createWorkspaceCatalogClient(http, base), ...createStaticResourceClient(http, base), readImportFile: readSourceImportFile };
}
