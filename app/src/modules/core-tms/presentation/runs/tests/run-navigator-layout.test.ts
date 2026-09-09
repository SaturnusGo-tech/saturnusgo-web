import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useSelectedRunResource } from "../../../state/run-resource/useSelectedRunResource";
import { resolveRunListMode, runListSelection, runScopeState } from "../state/run-view-state";
import { fileURLToPath } from "node:url";

const view = readFileSync(fileURLToPath(new URL("../navigator/RunNavigator.tsx", import.meta.url)), "utf8");
const picker = readFileSync(fileURLToPath(new URL("../navigator/picker/RunPicker.tsx", import.meta.url)), "utf8");
const marquee = readFileSync(fileURLToPath(new URL("../navigator/RunNameMarquee.tsx", import.meta.url)), "utf8");
const styles = readFileSync(fileURLToPath(new URL("../navigator/run-navigator.module.css", import.meta.url)), "utf8");
const executionHeader = readFileSync(fileURLToPath(new URL("../header/RunExecutionHeader.tsx", import.meta.url)), "utf8");
const runsView = readFileSync(fileURLToPath(new URL("../RunsView.tsx", import.meta.url)), "utf8");
const runStyles = readFileSync(fileURLToPath(new URL("../runs.module.css", import.meta.url)), "utf8");
const prioritySignal = readFileSync(fileURLToPath(new URL("../../cases/list/priority/PrioritySignal.tsx", import.meta.url)), "utf8");

test("run picker keeps long names compact and calmly reveals their full text", () => {
  assert.match(picker, /className=\{styles\.pickerTriggerText\}/);
  assert.match(picker, /<RunNameMarquee name=\{props\.selectedRun\?\.name \?\? props\.emptyLabel\} motion="always" \/>/);
  assert.match(picker, /<RunNameMarquee name=\{run\.name\} motion="interaction" \/>/);
  assert.doesNotMatch(view, /<small>\{selectedRun\.key\}<\/small>/);
  assert.match(marquee, /title=\{name\}/);
  assert.match(marquee, /content\.scrollWidth - viewport\.clientWidth/);
  assert.match(marquee, /data-overflow=\{distance > 0 \|\| undefined\}/);
  assert.match(styles, /\.runNameViewport\s*\{[^}]*overflow: hidden;[^}]*white-space: nowrap;/s);
  assert.match(styles, /animation: run-name-pan var\(--run-name-duration\) ease-in-out [^;]* infinite alternate;/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.runNameAlways\[data-overflow="true"\][\s\S]*animation: none;/);
  assert.match(styles, /\.pickerTrigger, \.pickerCreate\s*\{[^}]*min-height: 34px;/s);
  assert.match(styles, /\.pickerOption, \.pickerOptionActive\s*\{[^}]*min-height: 42px;/s);
});

test("run execution identifies the case type from its immutable snapshot", () => {
  assert.match(runsView, /<TypeBadge locale=\{locale\} type=\{selectedItem\.snapshot\.type\}/);
  assert.match(view, /<CaseTypeIcon locale=\{locale\} type=\{testCase\.type\}/);
});

test("run execution follows the test-case list and detail hierarchy", () => {
  assert.match(view, /className=\{styles\.itemsToolbar\}/);
  assert.match(view, /className=\{styles\.itemColumns\}/);
  assert.match(view, /className=\{styles\.itemKey\}/);
  assert.match(styles, /\.item, \.itemActive\s*\{[^}]*min-height: 48px;/s);
  assert.match(runsView, /className=\{runStyles\.overviewLayout\}/);
  assert.match(runsView, /className=\{runStyles\.sideRail\}/);
  assert.match(runsView, /<PriorityBadge locale=\{locale\} priority=\{selectedItem\.snapshot\.priority\}/);
  assert.match(runsView, /<EstimateBadge locale=\{locale\} minutes=\{selectedItem\.snapshot\.estimatedMinutes\}/);
  assert.match(executionHeader, /Кейс \$\{itemIndex \+ 1\} из \$\{itemCount\}/);
  assert.match(runStyles, /\.overviewLayout\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) minmax\(178px, 31%\);/s);
});

test("run listing shares semantic priority signals, neutral type icons, and calm not-run status", () => {
  assert.match(view, /className=\{styles\.prioritySignal\}/);
  assert.match(view, /className=\{styles\.typeSignal\}/);
  assert.match(view, /<PrioritySignal priority=\{testCase\.priority\}/);
  assert.match(view, /className=\{styles\.prioritySortButton\}/);
  assert.match(prioritySignal, /priority === "low" \? Diamond : Triangle/);
  assert.match(prioritySignal, /priority === "high" \|\| priority === "critical"/);
  assert.match(styles, /grid-template-columns: 32px 36px 88px minmax\(0, 1fr\) 102px/);
  assert.match(styles, /\.execution_passed\s*\{[^}]*background: #14864f;/s);
  assert.match(styles, /\.execution_not_run\s*\{[^}]*background: #e1e4e8;/s);
  assert.match(view, /item\.status === "not_run" \? <CircleDashed/);
  assert.match(styles, /\.typeSignal\s*\{ color: var\(--runs-muted\); \}/);
  assert.match(styles, /\.navigator button:focus-visible[^}]*outline: 0;/s);
  assert.doesNotMatch(runStyles, /focus-visible\s*\{[^}]*outline: 2px solid var\(--runs-primary\)/s);
});

test("a selected run starts pending before effects, even though its initial item list is empty", () => {
  let state: ReturnType<typeof useSelectedRunResource> | undefined;
  function Probe() {
    state = useSelectedRunResource({
      http: {} as Parameters<typeof useSelectedRunResource>[0]["http"], connection: "connected", projectId: "p", selectedRunId: "run",
      selectedRunItemId: "item", setSelectedRunItemId: () => {}, setData: () => {},
    });
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  assert.ok(state);
  assert.equal(state.runResourceReady, false);
  assert.equal(state.runResourceLoading, true);
  assert.deepEqual(state.runItems, []);
  assert.equal(runScopeState(state.runResourceLoading, state.runItems.length), "loading");
});

test("pending scope and authoritative empty scope are different render states", () => {
  // The run summary can already exist while /items is delayed, or while retrying.
  assert.equal(runScopeState(true, 0), "loading");
  assert.equal(runScopeState(true, 6), "loading");
  assert.equal(runScopeState(false, 6), "ready");
  assert.equal(runScopeState(false, 0), "empty");
});

test("a linked archived run selects history on its first render", () => {
  const archived = { id: "archived", archivedAt: "2026-09-09T00:00:00Z" };
  assert.equal(resolveRunListMode(runListSelection(archived), archived), "archived");
  assert.equal(resolveRunListMode(runListSelection(null), archived), "archived");
});

test("navigation and archive changes resolve the correct list without waiting for an effect", () => {
  const active = { id: "active", archivedAt: null };
  const archived = { id: "archived", archivedAt: "2026-09-09T00:00:00Z" };
  const selection = runListSelection(active);
  assert.equal(resolveRunListMode(selection, archived), "archived");
  assert.equal(resolveRunListMode(runListSelection(archived), active), "active");
  assert.equal(resolveRunListMode(selection, { ...active, archivedAt: archived.archivedAt }), "archived");
  assert.equal(resolveRunListMode(runListSelection(archived), { ...archived, archivedAt: null }), "active");
});

test("explicitly opening an empty list remains possible for the current run", () => {
  const active = { id: "active", archivedAt: null };
  assert.equal(resolveRunListMode(runListSelection(active, "archived"), active), "archived");
  assert.equal(resolveRunListMode(runListSelection(null, "archived"), null), "archived");
});
