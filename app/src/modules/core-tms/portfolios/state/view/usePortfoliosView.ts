import { useEffect, useState, type ReactNode } from "react";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { loadProjectCatalog } from "../../../projects/catalog/application/list-projects";
import { loadCatalogProject } from "../../../projects/catalog/application/get-project";
import { attachProject } from "../../../projects/catalog/application/assignment/attach-project";
import { getPortfolio, listPortfolios, savePortfolio, transitionPortfolio } from "../../data/portfolio-api";
import type { Portfolio, PortfolioDraft, PortfolioResource, PortfolioRoute, PortfolioTab } from "../../model/portfolio";
import { useCatalogPage } from "../catalog/useCatalogPage";
import { useResource } from "../detail/useResource";
import { usePortfolioCommand } from "../command/usePortfolioCommand";

export type PortfoliosViewProps = {
  workspaceId: string;
  offline: boolean;
  canManage?: boolean;
  canManageAttachments?: boolean;
  canReadAttachments?: boolean;
  route?: PortfolioRoute;
  onNavigate?: (route: PortfolioRoute) => void;
  onActivateProject: (projectId: string) => Promise<boolean>;
  projectCases: ReactNode;
  onProjectCreated: (project: Project) => void;
  onProjectUpdated: (project: Project, etag: string | null) => void;
};
type Dialog = null | "attach" | "archive";

export function usePortfoliosView(props: PortfoliosViewProps) {
  const http = useTmsHttpClient();
  const [localRoute, setLocalRoute] = useState<PortfolioRoute>({ kind: "catalog" });
  const route = props.route ?? localRoute;
  const [tab, setTab] = useState<PortfolioTab>("all");
  const [status, setStatus] = useState<Portfolio["status"]>("active");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<"project" | "portfolio" | null>(null);
  const resourceId = "id" in route ? route.id : "";
  const scope = `${props.workspaceId}:${route.kind}:${resourceId}`;
  useEffect(() => { setDialog(null); setSearch(""); setStatus("active"); }, [scope]);
  const enabled = Boolean(props.workspaceId) && !props.offline;
  const command = usePortfolioCommand(`${scope}:${dialog}`);
  const portfolioList = useCatalogPage(`${props.workspaceId}:portfolios:${status}`, enabled && route.kind === "catalog" && tab !== "unassigned",
    (cursor, signal) => listPortfolios(http, props.workspaceId, status, cursor, signal));
  const projects = useCatalogPage(`${scope}:projects:${status}:${tab}`, enabled && (route.kind === "portfolio" || route.kind === "catalog" && tab !== "portfolios"),
    (cursor, signal) => loadProjectCatalog(http, { workspaceId: props.workspaceId, status,
      portfolioId: route.kind === "portfolio" ? route.id : undefined, unassigned: route.kind === "catalog" && tab === "unassigned" }, cursor, signal));
  const project = useResource(`${scope}:project`, enabled && route.kind === "project", (signal) => loadCatalogProject(http, resourceId, signal));
  const portfolioId = route.kind === "portfolio" ? route.id : route.kind === "project-create" ? route.portfolioId : project.data?.data.portfolioId;
  const portfolio = useResource<PortfolioResource>(`${props.workspaceId}:portfolio:${portfolioId ?? ""}`, enabled && Boolean(portfolioId),
    (signal) => getPortfolio(http, portfolioId!, signal));

  function navigate(next: PortfolioRoute) {
    setDialog(null); setSearch(""); setNotice(null); setStatus("active");
    if (props.onNavigate) props.onNavigate(next); else setLocalRoute(next);
  }
  function refresh() { portfolioList.reload(); projects.reload(); project.reload(); portfolio.reload(); }
  async function save(draft: PortfolioDraft) {
    if (props.offline || props.canManage === false) return;
    const current = null;
    const result = await command.run(JSON.stringify({ current, draft }), (key, signal) => savePortfolio(http, props.workspaceId, draft, current, key, signal));
    if (result) { setDialog(null); refresh(); navigate({ kind: "portfolio", id: result.data.id }); setNotice("portfolio"); }
  }
  async function transition() {
    if (props.offline || props.canManage === false || !portfolio.data?.etag) return;
    const current = portfolio.data;
    const action = current.data.status === "archived" ? "restore" : "archive";
    const result = await command.run(`${action}:${current.data.id}:${current.etag}`, (key, signal) => transitionPortfolio(http, current.data.id, action, current.etag!, key, signal));
    if (result) { setDialog(null); refresh(); }
  }
  async function attach(id: string) {
    if (props.offline || props.canManage === false || !portfolio.data) return;
    const targetId = portfolio.data.data.id;
    const result = await command.run(`attach:${id}:${targetId}`, (key, signal) => attachProject(http, id, targetId, key, signal));
    if (result) { props.onProjectUpdated(result.data, result.etag); setDialog(null); refresh(); }
  }
  function created(value: Project) {
    props.onProjectCreated(value); setDialog(null); refresh();
    navigate({ kind: "project", id: value.id });
  }
  function acceptProject(value: Project, etag: string | null) { project.accept({ data: value, etag }); props.onProjectUpdated(value, etag); }
  function updated(value: Project, etag: string | null) {
    props.onProjectUpdated(value, etag); setDialog(null); refresh(); setNotice("project");
  }
  function createProject() { navigate({ kind: "project-create", ...(portfolioId ? { portfolioId } : {}) }); }
  function cancelEditor() {
    if (dialog) setDialog(null);
    else navigate(route.kind === "project-create" && route.portfolioId ? { kind: "portfolio", id: route.portfolioId } : { kind: "catalog" });
  }
  return { route, tab, setTab, status, setStatus, search, setSearch, dialog, setDialog, notice,
    portfolioList, projects, project, portfolio, command, navigate, refresh, save, transition, attach, created, updated, acceptProject, createProject, cancelEditor };
}
