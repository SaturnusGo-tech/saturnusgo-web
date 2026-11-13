import assert from "node:assert/strict";
import test from "node:test";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import { localizedComponentLabel, localizedLabel } from "../../../../localization/format/labels";
import type { DefectReportProperties } from "../../detail/properties/DefectReportProperties";

const defect = { id: "bug", projectId: "project", status: "verified", severity: "critical", priority: "high",
  reproducibility: "Always", component: "Core product", labels: ["manual-run"], assigneeIdentityId: "actor",
  integrationTarget: "youtrack", externalIssue: { key: "TEAM-19", url: "https://tracker.example/issue/TEAM-19" } } as Defect;

function setup(input = defect, workspaceId: string | null = "workspace") {
  const h = componentHarness();
  const { DefectReportProperties: View } = h.load<{ DefectReportProperties: typeof DefectReportProperties }>(
    new URL("../../detail/properties/DefectReportProperties.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "ru", t: (key: string) => key }) };
      if (name.endsWith("labels")) return { localizedLabel, localizedComponentLabel };
      if (name.endsWith("PriorityIcon")) return { PriorityIcon: "PriorityIcon", priorityLabel: () => "Высокий" };
      return undefined;
    });
  const tree = nodes(h.render(() => View({ defect: input, workspaceId: workspaceId ?? undefined })));
  return { h, tree };
}

test("property rail labels severity and priority explicitly and omits the header status", () => {
  const f = setup();
  const rows = f.tree.filter(node => node.type === "PropertyRow" || (node.type as unknown as { name: string }).name === "PropertyRow");
  assert.ok(!rows.some(node => node.props.label === "reports.status"));
  assert.ok(!f.tree.some(node => node.type === "DefectStatusIcon"));
  assert.equal(rows.find(node => node.props.label === "reports.severity")?.props.value, "Критический");
  assert.equal(rows.find(node => node.props.label === "reports.priority")?.props.value, "Высокий");
  assert.equal(rows.find(node => node.props.label === "reports.component")?.props.value, "Основной продукт");
  assert.equal(rows.find(node => node.props.label === "Повторяемость")?.props.value, "Always");
  f.h.dispose();
});

test("property rail preserves responsible member hover, private connector scope, external link and labels", () => {
  const f = setup();
  const responsible = f.tree.find(node => node.type === "ResponsibleName")!;
  assert.equal(responsible.props.workspaceId, "workspace"); assert.equal(responsible.props.identityId, "actor");
  const connectors = f.tree.find(node => node.type === "ConnectorTargetLinks")!;
  assert.equal(connectors.props.workspaceId, "workspace"); assert.equal(connectors.props.projectId, "project");
  assert.equal(connectors.props.targetId, "bug");
  const link = f.tree.find(node => node.type === "a")!;
  assert.equal(link.props.href, defect.externalIssue?.url); assert.equal(link.props.target, "_blank");
  assert.equal(f.tree.find(node => node.type === "PropertyLabelTokens")?.props.labels, defect.labels);
  assert.ok(f.tree.some(node => node.type === "dt" && nodes(node.props.children).some(child => child.props.children === "reports.assignee")));
  f.h.dispose();
});

test("archived or unscoped reports do not load connector links and retain unassigned presentation", () => {
  for (const archivedAt of ["2026-11-13T10:00:00Z", null]) {
    const f = setup({ ...defect, archivedAt, assigneeIdentityId: null }, archivedAt ? "workspace" : null);
    assert.ok(!f.tree.some(node => node.type === "ConnectorTargetLinks"));
    assert.ok(f.tree.some(node => (node.type === "PropertyRow" || (node.type as unknown as { name: string }).name === "PropertyRow") && node.props.value === "common.unassigned"));
    f.h.dispose();
  }
});

test("each property renders its visible semantic label separately from the value", () => {
  const h = componentHarness();
  const { PropertyRow: Row } = h.load<{ PropertyRow: (props: { label: string; value: string; icon: string }) => unknown }>(
    new URL("../../detail/properties/PropertyRow.tsx", import.meta.url));
  const tree = nodes(h.render(() => Row({ label: "Severity", value: "High", icon: "severity-icon" })));
  const label = tree.find(node => node.type === "dt")!;
  const value = tree.find(node => node.type === "dd")!;
  assert.ok(nodes(label.props.children).some(node => node.props.children === "Severity"));
  assert.ok(nodes(value.props.children).some(node => node.props.children === "High"));
  assert.ok(!nodes(value.props.children).some(node => node.props.children === "Severity")); h.dispose();
});
