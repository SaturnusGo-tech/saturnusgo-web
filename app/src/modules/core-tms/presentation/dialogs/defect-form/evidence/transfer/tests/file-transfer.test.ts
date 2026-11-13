import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes, invoke } from "../../../../../../portfolios/tests/support/component-harness";
import { fileTransferHandlers } from "../../../../../cases/inspector/attachments/input/fileTransfer";
import { appendDefectFiles } from "../../../../defect-layout/files";

function composer() {
  const h = componentHarness(undefined, { File });
  const changes: File[][] = [];
  const props = {
    workspaceId: "workspace", offline: false, submitting: false, closing: false, error: "", panelRef: { current: null },
    value: { title: "Transfer fails", description: "", actualResult: "", expectedResult: "", component: "Payments",
      severity: "high", priority: "high", reproducibility: "always", assigneeIdentityId: null, link: "" },
    components: [], routing: { value: "", onChange() {}, options: [], disabled: false, resolved: true, message: "" },
    files: [] as File[], onFilesChange: (files: File[]) => { changes.push(files); props.files = files; },
    onChange() {}, onSubmit() {}, onClose() {},
  };
  const resolve = (name: string): unknown => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("/defect/copy")) return { getDefectDialogCopy: () => ({ title: "New bug report" }) };
    if (name.endsWith("validateDefectDraft")) return { validateDefectDraft: () => ({}) };
    if (name.endsWith("useDefectFileTransfer")) return h.load(new URL("../useDefectFileTransfer.ts", import.meta.url), resolve);
    if (name.endsWith("fileTransfer")) return { fileTransferHandlers };
    if (name.endsWith("/files")) return { appendDefectFiles };
    if (name.endsWith("evidenceBatchLimit")) return { MAX_EVIDENCE_FILES: 20 };
    return undefined;
  };
  const { DefectForm } = h.load<{ DefectForm: (props: unknown) => unknown }>(new URL("../../../DefectForm.tsx", import.meta.url), resolve);
  const render = () => nodes(h.render(() => DefectForm(props)));
  const form = () => render().find(node => node.type === "form")!;
  return { props, changes, form, render };
}

function event(files: File[], types = files.length ? ["Files"] : ["text/plain"]) {
  let prevented = 0, stopped = 0;
  const transfer = { files, items: [], types, dropEffect: "none" };
  return { dataTransfer: transfer, clipboardData: transfer,
    preventDefault() { prevented++; }, stopPropagation() { stopped++; },
    prevented: () => prevented, stopped: () => stopped };
}

test("binary paste attaches once from anywhere in the form; text paste remains editable", () => {
  const c = composer(); const image = new File(["PNG"], "capture.png", { type: "image/png" });
  assert.equal(typeof c.form().props.onPasteCapture, "function");
  const text = event([]); invoke(c.form(), "onPasteCapture", text);
  assert.equal(text.prevented(), 0); assert.equal(c.changes.length, 0);
  const paste = event([image]); invoke(c.form(), "onPasteCapture", paste);
  assert.equal(paste.prevented(), 1); assert.equal(paste.stopped(), 1);
  assert.equal(c.props.files.length, 1); assert.equal(c.props.files[0], image);
});

test("drop accepts mixed evidence and repeated events deduplicate without losing pending files", () => {
  const c = composer(); const png = new File(["png"], "image.png"); const pdf = new File(["pdf"], "trace.pdf");
  const form = c.form(); assert.equal(typeof form.props.onDropCapture, "function");
  const over = event([png]); invoke(form, "onDragOverCapture", over);
  assert.equal(over.prevented(), 1); assert.equal(over.dataTransfer.dropEffect, "copy");
  invoke(form, "onDropCapture", event([png]));
  invoke(form, "onDropCapture", event([png, pdf]));
  assert.equal(c.props.files.length, 2); assert.equal(c.props.files[1], pdf);
  const text = event([]); invoke(form, "onDropCapture", text); assert.equal(text.prevented(), 0);
});

test("submitting and closing consume external file drops without changing evidence", () => {
  const c = composer(); const file = new File(["mov"], "screen.mov");
  for (const state of ["submitting", "closing"] as const) {
    c.props[state] = true;
    const drop = event([file]); invoke(c.form(), "onDropCapture", drop);
    assert.equal(drop.prevented(), 1); assert.equal(c.changes.length, 0);
    c.props[state] = false;
  }
});

test("a batch over the shared upload limit preserves staged files and reports a recoverable error", () => {
  const c = composer(); const staged = new File(["log"], "existing.log"); c.props.files = [staged];
  const files = Array.from({ length: 20 }, (_, index) => new File(["log"], `log-${index}.txt`));
  invoke(c.form(), "onPasteCapture", event(files));
  assert.equal(c.props.files.length, 1); assert.equal(c.props.files[0], staged);
  const evidence = c.render().find(node => node.type === "DefectEvidence")!;
  assert.equal(evidence.props.limitExceeded, true);
  invoke(c.form(), "onDropCapture", event([files[0]]));
  assert.equal(c.props.files.length, 2);
  assert.equal(c.render().find(node => node.type === "DefectEvidence")!.props.limitExceeded, false);
});
