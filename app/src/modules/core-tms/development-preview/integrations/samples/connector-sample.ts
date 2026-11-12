import { connectionDraft } from "../../../connectors/model/connector-draft";
import type { Catalog, Connection, Delivery, Link, Provider } from "../../../connectors/model/connector-types";
import { sampleProjects, sampleWorkspace } from "./youtrack-sample";
export const sampleCatalog: Catalog = { projects: sampleProjects.map(p => ({ id: p.id, name: p.name })),
  suites: [{ id: "suite-payment", name: "Payments · Release verification and retry safety" }],
  environments: [{ id: "sandbox", name: "Sandbox · EU staging" }] };
export function sampleConnection(provider: Provider): Connection {
  const settings = connectionDraft(provider, null).settings;
  return { id: `sample-${provider}`, workspaceId: sampleWorkspace, projectId: "project-0", provider, enabled: true,
    rowVersion: 1, checkedAt: "2026-11-12T09:00:00Z", credentialsConfigured: true, webhookConfigured: true,
    settings: { ...settings, baseUrl: ["jira", "confluence"].includes(provider) ? "https://sample-team.atlassian.net" : "",
      remoteId: provider === "github" ? "sample-team/payments" : "sample-team", destinationId: "sample-destination",
      inboundReadyStatuses: ["Ready for retest"], outboundStatuses: { open: "Open", verified: "Verified" },
      rules: provider === "github" ? [{ id: "payments-release", event: "pull_request", suiteId: "suite-payment", environmentId: "sandbox", branches: ["main"], pathPrefixes: ["src/payments/"] }] : [] } };
}
export const sampleDeliveries: Delivery[] = ["delivered", "uncertain", "failed"].map((status, i) => ({
  id: `sample-delivery-${i}`, event: "run.complete", targetId: `run_sample_payment_verification_20261112_${i}`,
  direction: "outbound", status: status as Delivery["status"], attempts: 1, errorCode: i === 2 ? "HTTP_ERROR" : null,
  createdAt: "2026-11-12T09:00:00Z", updatedAt: "2026-11-12T09:00:00Z",
}));
export function sampleLinks(provider: Provider): Link[] {
  return sampleDeliveries.slice(0, 1).map(d => ({ workspaceId: sampleWorkspace, projectId: "project-0", connectionId: `sample-${provider}`,
    targetType: "run", targetId: d.targetId, remoteId: "sample-report", remoteKey: "Release verification · Payments",
    url: "https://example.invalid/report", remoteStatus: "Published", remoteUpdatedAt: null,
    metadata: { provider, providerName: provider, title: "Payment API · Retry safety verification" } }));
}
