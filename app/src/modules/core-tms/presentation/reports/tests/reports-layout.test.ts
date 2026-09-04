import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const list = readFileSync(new URL("../ReportsView.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("../detail/DefectReportDetail.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../reports.module.css", import.meta.url), "utf8");

test("report list follows the production split-view and keeps evidence out of rows", () => {
  assert.match(list, /className=\{surface\.listPane\}/);
  assert.match(list, /className=\{surface\.detailPanel\}/);
  assert.match(list, /data-selected=\{defect\.id === selectedDefectId/);
  assert.doesNotMatch(list, /AttachmentLink/);
  assert.doesNotMatch(list, /defect\.attachmentIds\.map/);
  assert.match(styles, /\.detailPanel\s*\{[^}]*animation: reportInspectorIn/s);
});

test("bug report detail uses case-like sections and media-first attachments", () => {
  assert.match(detail, /className=\{surface\.overviewLayout\}/);
  assert.match(detail, /className=\{surface\.sideRail\}/);
  assert.match(detail, /presentation="media" variant="gallery"/);
  assert.match(detail, /t\("reports\.actualResult"\)/);
  assert.match(detail, /t\("reports\.expectedResult"\)/);
  assert.match(styles, /\.statusChip\[data-status="open"\][^}]*background: #d73948/s);
});
