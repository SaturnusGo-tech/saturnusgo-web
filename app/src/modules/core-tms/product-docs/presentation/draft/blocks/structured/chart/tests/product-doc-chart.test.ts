import assert from "node:assert/strict";
import test from "node:test";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { parseProductDocChart, positionChartPoints, productDocChartLanguage } from "../model/product-doc-chart";

const chart = {
  version: 1,
  kind: "lead-time",
  title: "Lead time by priority",
  points: [
    { label: "HOST-BUG-008", priority: "high", days: 2.4, href: "/testcases/umbrella-home/work/?projectId=host&view=reports&defectId=bug-8" },
    { label: "HOST-BUG-009", priority: "critical", days: 0 },
  ],
};

test("recognizes the chart fence and preserves its observed values", () => {
  assert.equal(productDocChartLanguage, "falcon-chart");
  assert.deepEqual(parseProductDocChart(JSON.stringify(chart)), chart);
  assert.deepEqual(parseProductDocChart(JSON.stringify({ ...chart, points: [] }))?.points, []);
});

test("rejects invalid chart versions, nonfinite days, and unknown priorities", () => {
  assert.equal(parseProductDocChart(JSON.stringify({ ...chart, version: 2 })), undefined);
  for (const point of [{ ...chart.points[0], days: -1 }, { ...chart.points[0], priority: "urgent" },
    { ...chart.points[0], days: "1.2" }]) {
    assert.equal(parseProductDocChart(JSON.stringify({ ...chart, points: [point] })), undefined);
  }
  assert.equal(parseProductDocChart(JSON.stringify(chart).replace("2.4", "1e309")), undefined);
});

test("only links to root-relative Falcon defect records", () => {
  const { href: _href, ...point } = chart.points[0];
  for (const href of ["//outside.example/work/?projectId=a&view=reports&defectId=b", "javascript:alert(1)",
    "/\\outside.example/work/?projectId=a&view=reports&defectId=b", "/work/?view=reports&defectId=x",
    "/work/?projectId=a&view=reports&defectId=b&redirect=https%3A%2F%2Foutside.example", "/api/v1/defects/b"]) {
    assert.deepEqual(parseProductDocChart(JSON.stringify({ ...chart, points: [{ ...point, href }] }))?.points, [point]);
  }
});

test("preserves the chart data through a Markdown fence round trip", () => {
  const source = `Before\n\n\`\`\`${productDocChartLanguage}\n${JSON.stringify(chart, null, 2)}\n\`\`\`\n\nAfter`;
  const rendered = fromMarkdown(toMarkdown(fromMarkdown(source)));
  const block = rendered.children[1];
  assert.ok(block.type === "code");
  assert.equal(block.lang, productDocChartLanguage);
  assert.deepEqual(parseProductDocChart(block.value), chart);
});

test("separates identical durations horizontally inside their priority bucket", () => {
  const parsed = parseProductDocChart(JSON.stringify(chart));
  assert.ok(parsed);
  const { points } = parsed;
  const duplicate = { ...points[0], label: "HOST-BUG-010" };
  const [first, second, critical] = positionChartPoints([points[0], duplicate, points[1]]);
  assert.equal(first.days, second.days);
  assert.equal(first.position + second.position, 2);
  assert.ok(.5 < first.position && first.position < second.position && second.position < 1.5);
  assert.equal(critical.position, 0);
});
