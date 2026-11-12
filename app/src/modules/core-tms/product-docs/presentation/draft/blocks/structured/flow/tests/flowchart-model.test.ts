import assert from "node:assert/strict";
import test from "node:test";
import { createFlowchartModel, type MermaidFlowData } from "../model/flowchart-model";

import { flowchartEdgeRoute } from "../layout/flowchart-edge-route";
import { layoutFlowchart } from "../layout/flowchart-layout";

const input: MermaidFlowData = {
  direction: "LR",
  nodes: [
    { id: "check", text: "Has access?", type: "diamond" },
    { id: "open", text: "Open dashboard", type: "round" },
    { id: "deny", text: "Access denied", type: "round" },
  ],
  edges: [
    { start: "check", end: "open", text: "Yes", type: "arrow_point" },
    { start: "check", end: "deny", text: "Нет", type: "arrow_point" },
  ],
  groups: [{ id: "g", title: "Authorization", nodes: ["check", "open", "deny"] }],
};

test("keeps labels and grouping, and applies semantic or explicitly authored tones", () => {
  const source = [
    "flowchart LR",
    "%% falcon-style open teal",
    "%% falcon-style check ultramarine",
    "%% falcon-edge check deny violet",
    "%% falcon-detail open Continue to the requested workspace",
  ].join("\n");
  const graph = createFlowchartModel(input, source);
  assert.ok(graph);
  assert.equal(graph.direction, "RIGHT");
  assert.deepEqual(graph.nodes.map(({ id, tone, groupId }) => [id, tone, groupId]), [
    ["check", "amber", "g"], ["open", "teal", "g"], ["deny", "red", "g"],
  ]);
  assert.equal(graph.nodes[1].detail, "Continue to the requested workspace");
  assert.deepEqual(graph.edges.map(({ label, tone }) => [label, tone]), [["Yes", "green"], ["Нет", "violet"]]);
});

test("retains Mermaid for syntax with semantics the interactive view cannot express", () => {
  const edge = { ...input.edges[0], end: "g" };
  assert.equal(createFlowchartModel({ ...input, edges: [edge] }, "flowchart LR"), undefined);
  assert.equal(createFlowchartModel({ ...input, groups: [{ ...input.groups[0], dir: "TB" }] }, "flowchart LR"), undefined);
});

test("sizes cards to their own content without stretching short decisions to the longest card", async () => {
  const graph = createFlowchartModel({
    ...input,
    groups: [],
    nodes: [...input.nodes, { id: "long", text: "длинный".repeat(20), type: "square" }],
    edges: [
      { start: "check", end: "open", type: "arrow_point" },
      { start: "open", end: "long", type: "arrow_point" },
      { start: "check", end: "deny", text: "Нет", type: "arrow_point" },
      { start: "deny", end: "check", type: "arrow_point" },
    ],
  }, "flowchart LR\n%% falcon-style open teal\n%% falcon-detail open Настройки сохраняются для следующего заказа");
  assert.ok(graph);
  const { nodes, edges } = await layoutFlowchart(graph);
  const [first, second, third, long] = nodes;
  assert.equal(first.width, long.width);
  assert.equal(first.height, third.height);
  assert.ok(first.height < second.height);
  assert.ok(long.height > first.height);
  assert.equal(edges[0].tone, "teal");
  assert.ok(edges.every(edge => edge.route?.path.startsWith("M ")));
});

test("rounds the ELK corridor without replacing its obstacle-avoiding route with a crossing curve", () => {
  const edge = { id: "edge", sources: ["a"], targets: ["b"], sections: [{
    id: "section", startPoint: { x: 24, y: 10 }, endPoint: { x: 102, y: 52 },
    bendPoints: [{ x: 48, y: 10 }, { x: 48, y: 52 }],
  }] };
  const route = flowchartEdgeRoute(edge, { x: 6, y: 2 });
  assert.equal(route?.path, "M 30,12 L 42,12 Q 54,12 54,24 L 54,36 Q 54,54 72,54 L 108,54");
  assert.deepEqual(route?.start, { x: 30, y: 12 });
  assert.deepEqual(route?.end, { x: 108, y: 54 });
});

test("removes repeated and collinear route points so straight connectors do not develop tiny kinks", () => {
  const edge = { id: "edge", sources: ["a"], targets: ["b"], sections: [{
    id: "section", startPoint: { x: 20, y: 10 }, endPoint: { x: 20, y: 100 },
    bendPoints: [{ x: 20, y: 10 }, { x: 20, y: 50 }, { x: 20, y: 50 }],
  }] };
  assert.equal(flowchartEdgeRoute(edge, { x: 0, y: 0 })?.path, "M 20,10 L 20,100");
});

test("reserves the rendered height for wrapping edge labels", async () => {
  const graph = createFlowchartModel({ ...input, groups: [], edges: [{
    start: "check", end: "open", text: "Ответ не получен до финального дедлайна поиска исполнителя", type: "arrow_point",
  }] }, "flowchart TB\n%% falcon-preset procedure");
  assert.ok(graph);
  const { edges } = await layoutFlowchart(graph);
  assert.ok(edges[0].route?.labelWidth);
  assert.ok((edges[0].route?.labelHeight ?? 0) > 22);
});

test("uses an explicit presentation preset while keeping existing Mermaid direction otherwise", () => {
  const plain = { ...input, groups: [] };
  assert.equal(createFlowchartModel(plain, "flowchart LR")?.direction, "RIGHT");
  assert.equal(createFlowchartModel(plain, "flowchart LR\n%% falcon-preset procedure")?.direction, "DOWN");
  assert.equal(createFlowchartModel({ ...plain, direction: "TB" }, "flowchart TB\n%% falcon-preset pipeline")?.direction, "RIGHT");
  assert.equal(createFlowchartModel(plain, "flowchart LR\n%% falcon-preset arbitrary")?.preset, undefined);
});

test("keeps factual metrics bounded and uses consistent colors for typed pipeline connections", async () => {
  const source = [
    "flowchart LR",
    "%% falcon-preset metrics",
    "%% falcon-metric open Pass rate | 96.5%",
    "%% falcon-metric open Cases | 28 of 32",
    "%% falcon-metric open Coverage | 87.5%",
    "%% falcon-metric open Overflow | 99",
    "%% falcon-metric deny Unsafe | <img>",
  ].join("\n");
  const graph = createFlowchartModel(input, source);
  assert.equal(graph?.preset, "metrics");
  assert.deepEqual(graph?.nodes[1].metrics, [
    { label: "Pass rate", value: "96.5%" },
    { label: "Cases", value: "28 of 32" },
    { label: "Coverage", value: "87.5%" },
  ]);
  assert.equal(graph?.nodes[2].metrics, undefined);
  assert.ok(graph);
  const metricLayout = await layoutFlowchart(graph);
  assert.equal(metricLayout.preset, "metrics");
  const metricCard = metricLayout.nodes.find(node => node.id === "open");
  const plainCard = metricLayout.nodes.find(node => node.id === "deny");
  assert.ok(metricCard && plainCard && metricCard.height > plainCard.height);

  const pipeline = createFlowchartModel({
    ...input,
    edges: [
      { start: "check", end: "open", text: "JSON" },
      { start: "open", end: "deny", text: "JSON payload" },
    ],
  }, "flowchart LR\n%% falcon-preset pipeline\n%% falcon-edge open deny teal");
  assert.deepEqual(pipeline?.edges.map(edge => edge.tone), ["blue", "teal"]);
  assert.ok(pipeline);
  const pipelineLayout = await layoutFlowchart(pipeline);
  assert.equal(pipelineLayout.preset, "pipeline");
  assert.ok(pipelineLayout.edges.every(edge => edge.route?.start && edge.route?.end));
});
