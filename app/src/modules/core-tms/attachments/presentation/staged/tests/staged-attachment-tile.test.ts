import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { StagedAttachmentTile } from "../StagedAttachmentTile";
import { fileExtension, getFilePreviewKind } from "../../library/preview/model/file-preview-format";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";

function tile(t: TestContext, first: File) {
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  const created: File[] = [], revoked: string[] = [];
  URL.createObjectURL = blob => { created.push(blob as File); return `blob:staged-${created.length}`; };
  URL.revokeObjectURL = url => { revoked.push(url); };
  const h = componentHarness(undefined, { File });
  t.after(() => { h.dispose(); URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; });
  const { StagedAttachmentTile: View } = h.load<{ StagedAttachmentTile: typeof StagedAttachmentTile }>(
    new URL("../StagedAttachmentTile.tsx", import.meta.url), name =>
      name.endsWith("file-preview-format") ? { fileExtension, getFilePreviewKind } : undefined);
  let removed = 0;
  const props = { file: first, locale: "en" as const, disabled: false, onRemove: () => { removed++; } };
  const render = () => nodes(h.render(() => View(props)));
  const settled = () => { render(); return render(); };
  return { h, props, render, settled, created, revoked, removed: () => removed };
}

test("staged media owns one object URL per File and releases replacement and unmounted files", t => {
  const image = new File(["png"], "screen.png", { type: "image/png" });
  const movie = new File(["mov"], "recording.mov", { type: "video/quicktime" });
  const c = tile(t, image);
  assert.equal(c.settled().find(node => node.type === "img")?.props.src, "blob:staged-1");
  c.render(); assert.deepEqual(c.created, [image]);
  c.props.file = movie;
  assert.equal(c.settled().find(node => node.type === "video")?.props.src, "blob:staged-2");
  assert.deepEqual(c.revoked, ["blob:staged-1"]);
  c.h.dispose();
  assert.deepEqual(c.revoked, ["blob:staged-1", "blob:staged-2"]);
});

test("extension fallback previews a MOV even when the native File has no MIME", t => {
  const c = tile(t, new File(["mov"], "screen-recording.MOV"));
  assert.equal(c.settled().filter(node => node.type === "video").length, 1);
  assert.equal(c.created.length, 1);
});

test("PDF and ordinary files do not allocate media URLs", t => {
  const c = tile(t, new File(["pdf"], "report.pdf", { type: "application/pdf" }));
  assert.equal(c.settled().some(node => node.type === "img" || node.type === "video"), false);
  c.props.file = new File(["log"], "trace.log", { type: "text/plain" });
  c.settled(); assert.deepEqual(c.created, []);
});

for (const [mime, extension, element] of [["image/png", "png", "img"], ["video/quicktime", "mov", "video"]]) {
  test(`${element} decode failures leave a removable file tile`, t => {
    const c = tile(t, new File(["invalid-media"], `broken.${extension}`, { type: mime }));
    const media = c.settled().find(node => node.type === element)!;
    assert.ok(media);
    invoke(media, "onError");
    const fallback = c.render();
    assert.equal(fallback.some(node => node.type === element), false);
    assert.ok(fallback.some(node => node.type === "FileText" || node.type === "File"));
    assert.ok(fallback.find(node => node.type === "button"));
  });
}

test("removal has an accessible filename and is disabled while the form is busy", t => {
  const c = tile(t, new File(["pdf"], "evidence.pdf", { type: "application/pdf" }));
  let remove = c.settled().find(node => node.type === "button")!;
  assert.match(String(remove.props["aria-label"]), /evidence\.pdf/);
  invoke(remove, "onClick"); assert.equal(c.removed(), 1);
  c.props.disabled = true;
  remove = c.render().find(node => node.type === "button")!;
  assert.equal(remove.props.disabled, true);
  invoke(remove, "onClick"); assert.equal(c.removed(), 1);
});
