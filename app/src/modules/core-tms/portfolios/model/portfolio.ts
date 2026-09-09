import type { OrganizationFields } from "../management/model/organization";

export type Portfolio = Readonly<OrganizationFields & {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  responsibleIdentityId: string | null;
  status: "active" | "archived";
  archivedAt: string | null;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
}>;

export type PortfolioDraft = Pick<Portfolio, "name" | "description" | "responsibleIdentityId"> & Partial<OrganizationFields>;
export type PortfolioRoute = { kind: "catalog" } | { kind: "portfolio"; id: string } | { kind: "project"; id: string }
  | { kind: "portfolio-create" } | { kind: "project-create"; portfolioId?: string };
export type PortfolioTab = "all" | "portfolios" | "unassigned";
export type CatalogPage<T> = Readonly<{ items: readonly T[]; nextCursor: string | null }>;
export type PortfolioResource = Readonly<{ data: Portfolio; etag: string | null }>;
