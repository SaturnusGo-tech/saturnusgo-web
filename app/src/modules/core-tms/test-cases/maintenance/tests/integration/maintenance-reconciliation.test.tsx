import assert from "node:assert/strict";
import test from "node:test";
import React, { useEffect, useState } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { Bootstrap, TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { WorkspaceModel } from "../../../../state/model/useWorkspaceModel";
import { createEmptyRevision } from "../../../../helpers/cases/caseRevision";
import { useSelectedCaseResource } from "../../../../state/case-resource/useSelectedCaseResource";
import { mergeProjectCollections, type ProjectCollections } from "../../../../state/workspace/requests/project-collections";
import { useCaseMaintenance } from "../../application/useCaseMaintenance";
import { WorkspaceMaintenanceProvider } from "../../composition/WorkspaceMaintenanceProvider";
import { useMaintenanceWorkspace } from "../../context/MaintenanceContext";
import type { CaseMaintenance } from "../../model/case-maintenance";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { WorkspaceStage } from "../../../../presentation/workspace-stage/WorkspaceStage";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
const initial: CaseMaintenance = { status: "current", rowVersion: 0, updatedBy: null, updatedAt: null, source: null, note: null, etag: "maintenance-0" };
const marked: CaseMaintenance = { ...initial, status: "needs_update", rowVersion: 1, etag: "maintenance-1", source: { runId: "r", runItemId: "i", attemptNo: 1, revision: 1 } };
const row = { id: "a", projectId: "p", key: "P-1", folderId: null, folderPath: "/", currentRevision: 1,
  ...createEmptyRevision("en"), title: "Case", revisionCount: 1, archivedAt: null, etag: "case-1", createdAt: "2026-11-04T00:00:00Z", updatedAt: "2026-11-04T00:00:00Z", maintenance: initial } as TestCaseSummary;
const dto = { ...row, current: { ...createEmptyRevision("en"), title: "Case", steps: [] }, linkIds: [] };

test("maintenance provider and selected-case hydration settle once and metadata updates preserve the loaded content", async t => {
  const pending: ((value: unknown) => void)[] = []; let caseReads = 0, mounts = 0;
  const http = { getResource: async (path: string) => {
    if (path.endsWith("/maintenance")) return new Promise(resolve => pending.push(resolve));
    caseReads++; return { data: dto, etag: "case-1" };
  } } as unknown as TmsHttpClient;
  let current!: { data: Bootstrap; resource: ReturnType<typeof useSelectedCaseResource>; confirmed: ReturnType<typeof useMaintenanceWorkspace>["confirmed"]; setData: React.Dispatch<React.SetStateAction<Bootstrap>> };
  function Reader() {
    const workspace = useMaintenanceWorkspace();
    useCaseMaintenance(http, "a", true, workspace.confirmed, current.resource.detail?.maintenance);
    useEffect(() => { mounts++; }, []); return null;
  }
  function Observe({ data, resource, setData }: Pick<typeof current, "data" | "resource" | "setData">) { const workspace = useMaintenanceWorkspace(); current = { data, resource, confirmed: workspace.confirmed, setData }; return resource.detail ? <Reader /> : null; }
  function Harness() {
    const [data, setData] = useState({ workspace: { id: "w" }, projects: [], testCases: [row], runs: [], environments: [], suites: [], defects: [], externalLinks: [], meta: { authorization: { capabilities: ["test_case:manage"] } } } as unknown as Bootstrap);
    const resource = useSelectedCaseResource(http, "connected", data.testCases, "a");
    const model = { data, setData, setSelectedCaseDetail: resource.setDetail, connection: "connected" } as unknown as WorkspaceModel;
    return <WorkspaceMaintenanceProvider model={model}><Observe data={data} resource={resource} setData={setData} /></WorkspaceMaintenanceProvider>;
  }
  let view!: ReactTestRenderer; t.after(async () => { await act(async () => view.unmount()); });
  await act(async () => { view = create(<Harness />); });
  assert.ok(current.resource.detail, "canonical case content has hydrated");
  const before = current.data, detail = current.resource.detail!, content = detail.current;
  assert.equal(caseReads, 1); assert.equal(pending.length, 1);
  await act(async () => pending[0]({ data: initial, etag: initial.etag }));
  assert.equal(current.data, before, "an unchanged GET is a complete store no-op");
  assert.equal(current.resource.detail, detail); assert.equal(caseReads, 1); assert.equal(mounts, 1);
  await act(async () => current.confirmed("missing", initial)); assert.equal(current.data, before);
  await act(async () => current.confirmed("a", marked));
  assert.equal(current.resource.detail?.current, content); assert.equal(caseReads, 1);
  assert.equal(current.data.testCases[0].maintenance?.rowVersion, 1);
  const old = { testCases: [{ ...row, title: "Refreshed content" }], runs: [], environments: [], suites: [], defects: [], externalLinks: [] } as ProjectCollections;
  await act(async () => current.setData(data => mergeProjectCollections(data, "p", old)));
  assert.equal(current.data.testCases[0].title, "Refreshed content");
  assert.equal(current.data.testCases[0].maintenance?.rowVersion, 1, "a delayed catalog cannot revert confirmed maintenance");
  assert.equal(current.resource.detail?.maintenance?.rowVersion, 1); assert.equal(caseReads, 1);
});

test("project cases reached from portfolios inherit the live maintenance workspace provider", () => {
  const h = componentHarness();
  const { WorkspaceStage: Stage } = h.load<{ WorkspaceStage: typeof WorkspaceStage }>(new URL("../../../../presentation/workspace-stage/WorkspaceStage.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
    if (name.endsWith("useWorkspaceCapabilities")) return { useWorkspaceCapabilities: () => ({ value: { canConnect: true } }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => null };
    if (name.endsWith("company-features")) return { companyViewAvailable: () => true };
    if (name.endsWith("workspace-view-access")) return { workspaceViewAllowed: () => true };
  });
  const model = { view: "portfolios", connection: "connected", project: { id: "p" }, data: { workspace: { id: "w" }, meta: { authorization: { capabilities: [] } } } } as unknown as WorkspaceModel;
  const rendered = nodes(h.render(() => Stage({ model })));
  assert.equal(rendered[0].type, "WorkspaceMaintenanceProvider");
  assert.equal(rendered[1].type, "WorkspacePortfoliosStage");
});
test("an in-flight case detail response keeps newer maintenance from the same content ETag", async t => {
  let finish!: (value: unknown) => void;
  const http = { getResource: () => new Promise(resolve => { finish = resolve; }) } as unknown as TmsHttpClient;
  let update!: React.Dispatch<React.SetStateAction<TestCaseSummary[]>>, selected!: ReturnType<typeof useSelectedCaseResource>;
  function Harness() {
    const [rows, setRows] = useState([row]); update = setRows;
    selected = useSelectedCaseResource(http, "connected", rows, "a"); return null;
  }
  let view!: ReactTestRenderer; t.after(async () => { await act(async () => view.unmount()); });
  await act(async () => { view = create(<Harness />); });
  await act(async () => update([{ ...row, maintenance: marked }]));
  await act(async () => finish({ data: dto, etag: "case-1" }));
  assert.equal(selected.detail?.maintenance?.rowVersion, 1);
  assert.equal(selected.detail?.current.title, "Case"); assert.equal(selected.etag, "case-1");
  const content = selected.detail?.current;
  await act(async () => update([{ ...row, maintenance: { ...marked, rowVersion: 2, etag: "maintenance-2" } }]));
  assert.equal(selected.detail?.maintenance?.rowVersion, 2, "new catalog metadata reaches an already loaded detail without changing its content ETag");
  assert.equal(selected.detail?.current, content);
});
