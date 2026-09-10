import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { avatarFileBase64 } from "../../data/avatar-file";
import { prepareAvatarImage } from "../../data/image/prepare-avatar-image";

function browserImage(t: TestContext, sizes: number[], onDecode?: () => void) {
  const descriptors = ["document", "createImageBitmap"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  let closed = false;
  const frames: { width: number; height: number; quality: number | undefined }[] = [];
  const canvas = { width: 0, height: 0,
    getContext: () => ({ drawImage() {}, imageSmoothingEnabled: false, imageSmoothingQuality: "low" }),
    toBlob: (callback: (blob: Blob) => void, type: string, quality?: number) => {
      frames.push({ width: canvas.width, height: canvas.height, quality });
      callback(new Blob([new Uint8Array(sizes.shift() ?? 0)], { type }));
    } };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { createElement: () => canvas } });
  Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async (_file: Blob, options: ImageBitmapOptions) => {
    assert.equal(options.imageOrientation, "from-image");
    assert.equal(options.resizeWidth, 1024);
    onDecode?.();
    return { width: 1024, height: 1365, close: () => { closed = true; } };
  } });
  t.after(() => { for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
  } });
  return { canvas, frames, closed: () => closed };
}

void test("a five-megabyte photo is resized proportionally and its compressed bytes reach the upload encoder", async (t) => {
  const browser = browserImage(t, [700_000]);
  const source = new Blob([new Uint8Array(5_000_000)], { type: "image/jpeg" });
  const encoded = await avatarFileBase64(source, new AbortController().signal);
  assert.equal(Buffer.from(encoded, "base64").length, 700_000);
  assert.equal(browser.frames.length, 1);
  assert.equal(browser.frames[0].height, 1024);
  assert.ok(browser.frames[0].width < browser.frames[0].height);
  assert.equal(browser.closed(), true);
  assert.equal(browser.canvas.width, 0);
});

void test("compression retries with smaller dimensions and never returns an oversized upload", async (t) => {
  const browser = browserImage(t, [1_500_000, 1_100_000, 200_000]);
  const blob = await prepareAvatarImage(new Blob([new Uint8Array(5_000_000)], { type: "image/png" }), new AbortController().signal);
  assert.equal(blob.size, 200_000);
  assert.equal(blob.type, "image/webp");
  assert.deepEqual(browser.frames.map((frame) => frame.height), [1024, 768, 512]);
  assert.equal(browser.closed(), true);
});

void test("cancellation after decoding closes the image without encoding or uploading", async (t) => {
  const controller = new AbortController();
  const browser = browserImage(t, [], () => controller.abort());
  await assert.rejects(prepareAvatarImage(new Blob([new Uint8Array(2_000_000)], { type: "image/png" }), controller.signal), { name: "AbortError" });
  assert.equal(browser.frames.length, 0);
  assert.equal(browser.closed(), true);
});

void test("small images keep their original bytes; unsupported and excessive sources fail before decoding", async () => {
  const signal = new AbortController().signal;
  const small = new Blob([new Uint8Array(100)], { type: "image/png" });
  assert.equal(await prepareAvatarImage(small, signal), small);
  await assert.rejects(prepareAvatarImage(new Blob(["<svg>unsafe</svg>"], { type: "image/svg+xml" }), signal), { code: "INVALID_AVATAR" });
  await assert.rejects(prepareAvatarImage(new Blob([new Uint8Array(26_214_401)], { type: "image/jpeg" }), signal), { code: "AVATAR_SOURCE_TOO_LARGE" });
});

void test("failed encoders release their resources and report an actionable image error", async (t) => {
  const browser = browserImage(t, [2_000_000, 2_000_000, 2_000_000, 2_000_000]);
  await assert.rejects(prepareAvatarImage(new Blob([new Uint8Array(3_000_000)], { type: "image/webp" }), new AbortController().signal), { code: "INVALID_AVATAR" });
  assert.equal(browser.closed(), true);
  assert.equal(browser.canvas.height, 0);
});
