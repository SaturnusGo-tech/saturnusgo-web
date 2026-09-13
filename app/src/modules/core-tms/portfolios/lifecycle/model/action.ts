import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import type { Portfolio } from "../../model/portfolio";
export type CatalogAction = { kind: "portfolio"; item: Portfolio; action: "archive" | "restore" | "remove" }
  | { kind: "project"; item: Project; action: "archive" | "restore" | "detach" };
