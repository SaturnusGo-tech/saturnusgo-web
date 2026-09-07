import type { WorkbenchFailure } from "./workbench";

export class WorkbenchReadError extends Error {
  constructor(readonly failure: WorkbenchFailure) {
    super(`Dashboard workbench request failed: ${failure.kind}`);
    this.name = "WorkbenchReadError";
  }
}
