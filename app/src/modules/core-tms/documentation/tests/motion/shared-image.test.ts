import assert from "node:assert/strict";
import { test } from "node:test";
import { screenshotGeometry, startScreenshotTransition } from "../../presentation/walkthrough/motion/shared-image";
import { motionDom } from "./fake-dom";
import { screenshotOrigin } from "../../presentation/walkthrough/motion/useScreenshotMotion";

test("opening flies from the clicked image and finishing restores the real image without clones", async () => {
  const d = motionDom(); let finished = 0;
  startScreenshotTransition({ ...d.args, onFinish: () => finished++ });
  assert.equal(d.clones.length, 1); assert.equal(d.target.style.visibility, "hidden");
  const flight = d.animations.find(animation => animation.frames.some(frame => frame.transform))!;
  assert.equal(flight.frames[0].transform, "translate(-40px, 30px) scale(0.25, 0.25)");
  assert.equal(flight.frames[1].transform, "translate(0px, 0px) scale(1, 1)");
  for (const animation of d.animations) animation.finish();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(d.clones[0].isConnected, false); assert.equal(d.target.style.visibility, ""); assert.equal(finished, 1);
});

test("closing reverses toward the current visible image and does not complete until motion finishes", async () => {
  const d = motionDom(); let finished = 0;
  startScreenshotTransition({ ...d.args, closing: true, onFinish: () => finished++ });
  const flight = d.animations.find(animation => animation.frames.some(frame => frame.transform))!;
  assert.equal(flight.frames[0].transform, "translate(0px, 0px) scale(1, 1)");
  assert.equal(flight.frames[1].transform, "translate(-40px, 30px) scale(0.25, 0.25)");
  assert.equal(finished, 0);
  for (const animation of d.animations) animation.finish();
  await new Promise(resolve => setTimeout(resolve, 0)); assert.equal(finished, 1);
});

test("cancel, scroll and resize remove overlays and restore styles exactly once", async () => {
  for (const event of ["cancel", "scroll", "resize"]) {
    const d = motionDom(); let finished = 0;
    const cancel = startScreenshotTransition({ ...d.args, onFinish: () => finished++ });
    if (event === "cancel") cancel();
    else (event === "scroll" ? d.document : d.view).dispatchEvent(new Event(event));
    assert.equal(d.clones[0].isConnected, false); assert.equal(d.target.style.visibility, "");
    assert.equal(finished, event === "cancel" ? 0 : 1);
    cancel(); for (const animation of d.animations) animation.finish();
    await new Promise(resolve => setTimeout(resolve, 0)); assert.equal(finished, event === "cancel" ? 0 : 1);
  }
});

test("reduced motion opens immediately; an unavailable origin fades without a geometric flight", async () => {
  const d = motionDom(); d.view.matchMedia = () => ({ matches: true }); let finished = 0;
  startScreenshotTransition({ ...d.args, onFinish: () => finished++ });
  assert.equal(finished, 1); assert.equal(d.animations.length, 0); assert.equal(d.clones.length, 0);
  const missing = motionDom();
  startScreenshotTransition({ ...missing.args, origin: null });
  assert.equal(missing.clones.length, 0); assert.equal(missing.target.style.visibility, "");
  assert.ok(missing.animations.length > 0);
  for (const animation of missing.animations) animation.finish();
  await new Promise(resolve => setTimeout(resolve, 0));
});

test("gallery letterboxing and clipped viewer images retain their actual painted geometry", () => {
  const d = motionDom();
  const image = d.image({ left: 20, top: 30, width: 270, height: 157 }); image.computed = { objectFit: "contain" };
  const geometry = screenshotGeometry(image as unknown as HTMLImageElement)!;
  assert.ok(Math.abs(geometry.width - 251.2) < 0.001); assert.equal(geometry.height, 157);
  assert.ok(Math.abs(geometry.left - 29.4) < 0.001); assert.equal(geometry.top, 30);
  const parent = { parentElement: null, computed: { overflowY: "auto" }, getBoundingClientRect: () => ({ left: 0, top: 0, right: 1440, bottom: 500 }) };
  const clipped = d.image({ left: 100, top: 100, width: 1152, height: 720 }, parent);
  assert.equal(screenshotGeometry(clipped as unknown as HTMLImageElement)?.clip, "inset(0% 0% 44.44444444444444% 0%)");
  image.isConnected = false; assert.equal(screenshotGeometry(image as unknown as HTMLImageElement), null);
});

test("disconnect and unavailable animation support cannot leave invisible images or overlay ghosts", () => {
  const d = motionDom(); let finished = 0;
  startScreenshotTransition({ ...d.args, onFinish: () => finished++ });
  d.origin.isConnected = false; d.observers[0].check();
  assert.equal(d.clones[0].isConnected, false); assert.equal(d.target.style.visibility, "");
  assert.equal(d.observers[0].disconnected, true); assert.equal(finished, 1);
  const unsupported = motionDom(); unsupported.args.image.animate = undefined as never;
  startScreenshotTransition({ ...unsupported.args, onFinish: () => finished++ });
  assert.equal(finished, 2); assert.equal(unsupported.clones.length, 0);
});

test("slide changes return to the matching visible thumbnail, never to a different or disconnected image", () => {
  const d = motionDom(), next = d.image({ left: 400, top: 200, width: 288, height: 180 });
  next.src = "/falcon/docs/2026-09/next.jpg"; d.target.src = next.src;
  const scope = { querySelector: () => next };
  const button = { closest: () => scope, querySelector: () => d.origin } as unknown as HTMLButtonElement;
  assert.equal(screenshotOrigin(button, 1, d.args.image), next);
  next.isConnected = false; assert.equal(screenshotOrigin(button, 1, d.args.image), null);
  d.target.src = d.origin.src; assert.equal(screenshotOrigin(button, 0, d.args.image), d.origin);
  d.origin.isConnected = false; assert.equal(screenshotOrigin(button, 0, d.args.image), null);
});
