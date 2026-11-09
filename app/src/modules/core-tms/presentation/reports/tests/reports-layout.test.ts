import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const list = readFileSync(new URL("../ReportsView.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("../detail/DefectReportDetail.tsx", import.meta.url), "utf8");
const row = readFileSync(new URL("../branches/DefectRow.tsx", import.meta.url), "utf8");
const browser = readFileSync(new URL("../browser/DefectBrowser.tsx", import.meta.url), "utf8");
const header = readFileSync(new URL("../detail/header/DefectReportHeader.tsx", import.meta.url), "utf8");
const properties = readFileSync(new URL("../detail/properties/DefectReportProperties.tsx", import.meta.url), "utf8");

test("report list follows the production split-view and keeps evidence out of rows", () => {
  assert.match(list, /<DefectBrowser/);
  assert.match(browser, /<DefectBranch/);
  assert.match(list, /className=\{surface\.detailPanel\}/);
  assert.match(row, /data-selected=\{selected/);
  assert.doesNotMatch(list, /AttachmentLink/);
  assert.doesNotMatch(list, /defect\.attachmentIds\.map/);
  assert.match(list, /<AnimatePresence>[\s\S]*<motion\.aside[\s\S]*exit=/);
  assert.match(row, /<PriorityIcon level=\{defect\.priority\}/);
  assert.match(row, /<DefectStatusIcon status=\{defect\.status\}/);
  assert.doesNotMatch(row, /statusChip/);
  assert.match(browser, /onSeveritySortChange/);
  assert.doesNotMatch(list, /<AlertTriangle/);
});

test("bug report detail shares case inspector styling, tabs, and attachments", () => {
  assert.match(header, /case-detail-tabs\.module\.css/);
  assert.match(header, /<Tabs aria-label=/);
  assert.match(detail, /role="tabpanel" aria-labelledby=/);
  assert.match(detail, /inspector\.sectionBody/);
  assert.match(detail, /<MarkdownField value=\{defect\.actualResult\}/);
  assert.match(detail, /<MarkdownField value=\{defect\.expectedResult\}/);
  assert.match(detail, /case-attachments\.module\.css/);
  assert.match(detail, /presentation="media" variant="gallery"/);
  assert.doesNotMatch(header, /defect\.status/);
  assert.match(properties, /<DefectStatusIcon status=\{defect\.status\}/);
  assert.match(properties, /defect\.externalIssue\.url/);
  assert.match(properties, /defect\.externalIssue\.key/);
});

test("the selected detail tab survives defect resource refreshes", () => {
  assert.match(list, /const \[detailTab, setDetailTab\] = (?:useState|useNavigationValue)<DetailTab>\([^)]*"overview"\)/);
  assert.match(list, /tab=\{detailTab\}/);
  assert.match(list, /onTabChange=\{setDetailTab\}/);
  assert.doesNotMatch(detail, /useState<DetailTab>/);
});
