import assert from "node:assert/strict";
import { test } from "node:test";
import { createExchangeFixture, exchangeProjects, exchangeWorkspace } from "../exchange-fixture";
import { decodeImportFile } from "../../../test-cases/exchange/application/source/decode-import-file";
import { parseTestCaseExchange } from "../../../test-cases/exchange/validation/parse-test-case-exchange";
import { loadImportContext } from "../../../test-cases/exchange/data/context/import-context";
import { buildImportPlan } from "../../../test-cases/exchange/application/preview/build-import-plan";
import { externalImportClient } from "../../../test-cases/exchange/data/normalization/external-import-client";
import { normalizeExternalImport } from "../../../test-cases/exchange/application/normalization/normalize-external-import";
import type { ExternalImportCheckpoint } from "../../../test-cases/exchange/model/external/external-import";
import { createImportSourceSaver } from "../../../test-cases/exchange/library/application/save-import-source";
import { prepareImportFolders } from "../../../test-cases/exchange/data/folders/prepare-import-folders";
import { importProjectCases } from "../../../test-cases/exchange/application/import-project-cases";
import { exportProjectCases } from "../../../test-cases/exchange/application/export-project-cases";
import { importFileApi } from "../../../test-cases/exchange/library/data/import-files";
import { readImportFile } from "../../../test-cases/exchange/library/data/read-import-file";

const sample = JSON.stringify({ schemaVersion: "saturnusgo.tms.test-cases.v2", exportedAt: "2026-11-12",
  project: { key: "OLD", name: "Original" }, folders: ["/Bookings/Calendar", "/Empty"], testCases: [
    { title: "Original booking case", folderPath: "/Bookings/Calendar" },
    { title: "Original payment case", folderPath: "/Bookings/Payments" },
    { title: "Original checklist", folderPath: "/Release", type: "checklist", checklist: [{ text: "Authored optional check", required: false }] },
  ] });
void test("local native preview survives choosing project B and writes only to B after explicit commit", async () => {
  const events: string[] = [];
  const fixture = createExchangeFixture(event => events.push(event));
  const controller = new AbortController();
  const file = new File([sample], "booking-cloud-migration.json", { type: "application/json" });
  const decoded = await decodeImportFile(file);
  const document = parseTestCaseExchange(decoded.nativeText ?? JSON.stringify(decoded.source));
  const first = await loadImportContext(fixture.http, exchangeProjects[0].id, controller.signal);
  buildImportPlan(document, "/", first.folders);
  const target = await loadImportContext(fixture.http, exchangeProjects[1].id, controller.signal);
  const plan = buildImportPlan(document, "/Product guide/Releases", target.folders);
  assert.equal(document.testCases.length, 3);
  assert.equal(events.filter(event => event.startsWith("WRITE ")).length, 0);
  const save = createImportSourceSaver(fixture.http, fixture.attachments, () => undefined);
  await save(file, target.scope, "releases", controller.signal);
  await prepareImportFolders(fixture.http, target.scope, plan, target.folders, controller.signal, () => undefined);
  const imported = await importProjectCases(fixture.http, target.scope.projectId, plan.document);
  assert.equal(imported.completed, 3); assert.deepEqual(imported.failed, []);
  assert.ok(events.filter(event => event.startsWith("WRITE ")).every(event => event.includes("falcon-guide")));
  const history = await importFileApi.list(fixture.http, { workspaceId: exchangeWorkspace, projectId: "falcon-guide" }, "", null, controller.signal);
  assert.equal(history.items.length, 1); assert.equal(history.items[0].destinationPath, "/Product guide/Releases");
  const direct = await importFileApi.get(fixture.http, target.scope, history.items[0].id, controller.signal);
  assert.equal(direct.projectId, "falcon-guide");
  const access = await fixture.attachments.createAccess({ attachmentId: direct.id });
  assert.equal(await (await fetch(access.url)).text(), sample);
  assert.match(await readImportFile(fixture.attachments, direct.id, controller.signal, direct.fileName), /Original checklist/);
  const a = await exportProjectCases(fixture.http, exchangeProjects[0]);
  const b = await exportProjectCases(fixture.http, exchangeProjects[1]);
  assert.equal(a.project.key, "BOOK"); assert.equal(a.testCases.length, 2);
  assert.equal(b.project.key, "GUIDE"); assert.equal(b.testCases.length, 4);
  assert.equal(b.testCases.find(item => item.title === "Original checklist")?.checklist[0]?.required, false);
});

void test("local CSV preparation uses project A with no folder bias or repository writes", async () => {
  const events: string[] = [];
  const fixture = createExchangeFixture(event => events.push(event));
  const decoded = await decodeImportFile(new File(['Title,Description,Section\nBooking,Authored booking,Bookings\nPayment,Authored payment,Payments\n'], "booking-cloud-cases.csv", { type: "text/csv" }));
  const checkpoint: ExternalImportCheckpoint = { records: null, processed: 0, cases: [], issues: [] };
  await normalizeExternalImport(externalImportClient(fixture.http, exchangeProjects[0], "en"), decoded.source,
    checkpoint, [], new AbortController().signal, () => undefined);
  assert.equal(checkpoint.cases.length, 2); assert.deepEqual(checkpoint.issues, []);
  assert.ok(events.some(event => event.includes("PREPARE normalize booking-cloud folders=[]")));
  assert.equal(events.filter(event => event.startsWith("WRITE ")).length, 0);
});
