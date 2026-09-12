import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const list = readFileSync(new URL("../ReportsView.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("../detail/DefectReportDetail.tsx", import.meta.url), "utf8");
const row = readFileSync(new URL("../branches/DefectRow.tsx", import.meta.url), "utf8");
const browser = readFileSync(new URL("../browser/DefectBrowser.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../reports.module.css", import.meta.url), "utf8");

test("report list follows the production split-view and keeps evidence out of rows", () => {
  assert.match(list, /<DefectBrowser/);
  assert.match(browser, /<DefectBranch/);
  assert.match(list, /className=\{surface\.detailPanel\}/);
  assert.match(row, /data-selected=\{selected/);
  assert.doesNotMatch(list, /AttachmentLink/);
  assert.doesNotMatch(list, /defect\.attachmentIds\.map/);
  assert.match(list, /<AnimatePresence>[\s\S]*<motion\.aside[\s\S]*exit=/);
  assert.match(row, /<PrioritySignal priority=\{defect\.severity\}/);
  assert.match(browser, /onSeveritySortChange/);
  assert.doesNotMatch(list, /<AlertTriangle/);
});

test("bug report detail uses case-like sections and media-first attachments", () => {
  assert.match(detail, /surface\.overviewLayout/);
  assert.match(detail, /className=\{surface\.sideRail\}/);
  assert.match(detail, /presentation="media" variant="gallery"/);
  assert.match(detail, /t\("reports\.actualResult"\)/);
  assert.match(detail, /t\("reports\.expectedResult"\)/);
  assert.match(detail, /t\("reports\.issueLink"\)/);
  assert.match(detail, /defect\.externalIssue\.url/);
  assert.match(detail, /defect\.externalIssue\.key/);
  assert.match(row, /defect\.status === "open" \? <CircleDashed/);
  assert.match(styles, /\.statusChip\[data-status="open"\][^}]*background: #dfe2e7/s);
  assert.match(styles, /:global\(\.dark\) \.statusChip\[data-status="open"\][^}]*background: #4b5058/s);
});

test("the selected detail tab survives defect resource refreshes", () => {
  assert.match(list, /const \[detailTab, setDetailTab\] = (?:useState|useNavigationValue)<DetailTab>\([^)]*"overview"\)/);
  assert.match(list, /tab=\{detailTab\}/);
  assert.match(list, /onTabChange=\{setDetailTab\}/);
  assert.doesNotMatch(detail, /useState<DetailTab>/);
});
