import type { BillingPlanId } from "../../domain/billing";

export type PlanRequestStatus = "requested" | "contacted" | "approved" | "activating" | "active" | "declined" | "withdrawn" | "expired" | "revoked";
export type PlanRequest = {
  id: string;
  reference: string;
  planId: BillingPlanId;
  status: PlanRequestStatus;
  locale: "en" | "ru";
  workspaceId: string;
  workspaceName: string;
  workspaceKind: "personal" | "company";
  applicantName: string;
  applicantEmail: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  activationExpiresAt: string | null;
  accessEndsAt: string | null;
  setupId: string | null;
  companyHostname: string | null;
  preparationError: string | null;
  actions: readonly string[];
};
export type PlanRequestList = {
  requests: PlanRequest[];
  applicant: { displayName: string; email: string };
  workspace: { id: string; name: string; kind: "personal" | "company"; companyHostname?: string | null };
  access: { planId: BillingPlanId; endsAt: string | null } | null;
  eligiblePlanIds: readonly BillingPlanId[];
};

export const planNames = { individual: "Individual", startup: "Startup", enterprise: "Enterprise" } as const;
export const planSupportEmail = "falcon@saturnusgo.com";
export const pendingPlanStatuses = new Set<PlanRequestStatus>(["requested", "contacted", "approved", "activating"]);
const identifier = /^[A-Za-z0-9_-]{1,128}$/;

export function planRequestPlan(value: string | null): BillingPlanId | null {
  return value === "individual" || value === "startup" || value === "enterprise" ? value : null;
}

export function readPlanRequestIntent(search: string) {
  const params = new URLSearchParams(search);
  const single = (key: string) => params.getAll(key).length === 1 ? params.get(key) : null;
  const id = single("planRequest"), workspaceId = single("workspaceId"), planId = planRequestPlan(single("requestPlan"));
  if (params.has("planRequest")) return id && workspaceId && identifier.test(id) && identifier.test(workspaceId)
    ? { kind: "request" as const, id, workspaceId } : null;
  return planId ? { kind: "offer" as const, planId } : null;
}

export function withoutPlanRequestIntent(href: string) {
  const url = new URL(href);
  url.searchParams.delete("requestPlan");
  url.searchParams.delete("planRequest");
  return url;
}

type DraftFields = Pick<PlanRequest, "planId" | "reference" | "applicantName" | "applicantEmail" | "workspaceId" | "workspaceName" | "workspaceKind" | "companyHostname">;
export function planRequestDraft(request: DraftFields, ru: boolean) {
  const plan = planNames[request.planId];
  const subject = ru ? `Falcon · Заявка на ${plan} · ${request.reference}` : `Falcon · ${plan} access request · ${request.reference}`;
  const body = [
    ru ? "Здравствуйте! Хочу обсудить подключение Falcon." : "Hi Falcon team, I’d like to discuss access to Falcon.",
    "",
    `${ru ? "План" : "Plan"}: ${plan}`,
    `${ru ? "Номер заявки" : "Request reference"}: ${request.reference}`,
    `${ru ? "Имя" : "Name"}: ${request.applicantName}`,
    `Email: ${request.applicantEmail}`,
    `${ru ? "Пространство" : "Workspace"}: ${request.workspaceName}`,
    `${request.workspaceKind === "company" ? (ru ? "ID компании" : "Company ID") : (ru ? "ID пространства" : "Workspace ID")}: ${request.workspaceId}`,
    ...(request.companyHostname ? [`${ru ? "Домен компании" : "Company domain"}: ${request.companyHostname}`] : []),
  ].join("\r\n");
  return { href: `mailto:${planSupportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, subject, body };
}
