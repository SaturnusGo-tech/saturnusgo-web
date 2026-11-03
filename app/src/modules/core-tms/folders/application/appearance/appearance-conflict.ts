import type { RepositoryFolder } from "../../model/folder";
export class AppearanceConflict extends Error {
  constructor(message: string, readonly latestFolder: RepositoryFolder) { super(message); this.name = "AppearanceConflict"; }
}
