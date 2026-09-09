import assert from "node:assert/strict";
import { test } from "node:test";
import {
  connectPlaybackTimeline,
  formatPlaybackTime,
} from "../playback-timeline";

function fixture() {
  class Media extends EventTarget {
    duration = 23.25;
    currentTime = 0;
    paused = true;
    ended = false;
    seeking = false;
    readyState = 4;
    error: { code: number } | null = null;
  }
  const media = new Media();
  const attributes = new Map<string, string>();
  const range = {
    value: "0",
    max: "1",
    disabled: true,
    setAttribute: (key: string, value: string) => attributes.set(key, value),
  };
  const elapsed = { textContent: "0:00" };
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  let hidden = false;
  const controller = connectPlaybackTimeline(
    media as unknown as HTMLVideoElement,
    range as unknown as HTMLInputElement,
    elapsed as unknown as HTMLElement,
    {
      requestFrame: (callback) => {
        frames.set(++id, callback);
        return id;
      },
      cancelFrame: (key) => {
        frames.delete(key);
      },
      hidden: () => hidden,
    },
  );
  const event = (type: string) => media.dispatchEvent(new Event(type));
  const frame = () => {
    const next = [...frames.values()];
    frames.clear();
    for (const callback of next) callback(0);
  };
  const play = () => {
    media.paused = false;
    event("playing");
  };
  return {
    media,
    range,
    elapsed,
    attributes,
    frames,
    controller,
    event,
    frame,
    play,
    setHidden: (value: boolean) => {
      hidden = value;
      controller.visibilityChanged();
    },
  };
}

test("samples the actual media clock every display frame without timeupdate or tenth-second quantization", () => {
  const f = fixture();
  assert.equal(f.frames.size, 0);
  f.play();
  const values = [];
  for (let i = 1; i <= 60; i++) {
    f.media.currentTime = i / 60;
    f.frame();
    assert.equal(Number(f.range.value), f.media.currentTime);
    assert.equal(f.frames.size, 1);
    values.push(f.range.value);
  }
  assert.equal(new Set(values).size, 60);
  assert.equal(f.elapsed.textContent, "0:01");
  assert.equal(f.attributes.get("aria-valuetext"), "0:01 из 0:23");
  f.controller.cleanup();
});

test("waiting stops frames and resumes only when playback actually resumes", () => {
  const f = fixture();
  f.play();
  f.media.currentTime = 2.375;
  f.event("waiting");
  assert.equal(f.frames.size, 0);
  assert.equal(f.range.value, "2.375");
  f.media.readyState = 2;
  f.event("timeupdate");
  f.event("ratechange");
  assert.equal(f.frames.size, 0);
  f.frame();
  assert.equal(f.range.value, "2.375");
  f.media.readyState = 4;
  f.event("playing");
  assert.equal(f.frames.size, 1);
  f.controller.cleanup();
});

test("seeking, paused seeking, pause and end synchronize immediately and do not retain a frame loop", () => {
  const f = fixture();
  f.play();
  f.media.seeking = true;
  f.media.currentTime = 12.125;
  f.event("seeking");
  assert.equal(f.frames.size, 0);
  assert.equal(f.range.value, "12.125");
  f.media.seeking = false;
  f.event("seeked");
  assert.equal(f.frames.size, 1);
  f.media.paused = true;
  f.event("pause");
  assert.equal(f.frames.size, 0);
  f.controller.seek(4.75);
  f.event("seeked");
  assert.equal(f.range.value, "4.75");
  assert.equal(f.frames.size, 0);
  f.play();
  f.media.currentTime = f.media.duration;
  f.media.ended = true;
  f.event("ended");
  assert.equal(f.range.value, String(f.media.duration));
  assert.equal(f.frames.size, 0);
  f.controller.cleanup();
});

test("native drag owns the thumb, then release or cancellation resynchronizes it", () => {
  const f = fixture();
  f.play();
  f.controller.beginScrub();
  f.range.value = "8.123";
  f.controller.seek(8.123);
  f.media.currentTime = 8.14;
  f.frame();
  assert.equal(f.range.value, "8.123");
  assert.equal(f.elapsed.textContent, "0:08");
  f.controller.endScrub();
  assert.equal(f.range.value, "8.14");
  assert.equal(f.frames.size, 1);
  f.controller.cleanup();
});

test("hidden pages release the clock and cannot restart a video paused by the playback controller", () => {
  const f = fixture();
  f.play();
  f.setHidden(true);
  assert.equal(f.frames.size, 0);
  f.media.paused = true;
  f.setHidden(false);
  assert.equal(f.frames.size, 0);
  f.play();
  assert.equal(f.frames.size, 1);
  f.controller.cleanup();
});

test("cleanup removes event listeners, cancels pending callbacks and ignores stale callbacks", () => {
  const f = fixture();
  f.play();
  const pending = [...f.frames.values()][0];
  f.controller.cleanup();
  assert.equal(f.frames.size, 0);
  f.media.currentTime = 7;
  pending(0);
  f.event("playing");
  f.event("timeupdate");
  assert.equal(f.frames.size, 0);
  assert.equal(f.range.value, "0");
  f.controller.seek(10);
  assert.equal(f.media.currentTime, 7);
});

test("invalid metadata, errors and out-of-range seeks never produce invalid slider values", () => {
  const f = fixture();
  f.controller.seek(Number.NaN);
  assert.equal(f.media.currentTime, 0);
  f.controller.seek(-100);
  assert.equal(f.media.currentTime, 0);
  f.controller.seek(100);
  assert.equal(f.media.currentTime, f.media.duration);
  f.media.duration = Number.NaN;
  f.media.currentTime = Number.NaN;
  f.event("emptied");
  assert.equal(f.range.value, "0");
  assert.equal(f.range.max, "1");
  assert.equal(f.range.disabled, true);
  f.media.duration = 125.9;
  f.media.currentTime = 67.9;
  f.event("loadedmetadata");
  assert.equal(f.range.disabled, false);
  assert.equal(f.range.max, "125.9");
  assert.equal(f.attributes.get("aria-valuetext"), "1:07 из 2:05");
  f.play();
  f.media.error = { code: 2 };
  f.event("error");
  assert.equal(f.range.disabled, true);
  assert.equal(f.frames.size, 0);
  f.controller.cleanup();
});

test("the clock stops naturally if media cannot advance between events", () => {
  const f = fixture();
  f.play();
  f.media.readyState = 2;
  f.frame();
  assert.equal(f.frames.size, 0);
  f.controller.cleanup();
  assert.equal(formatPlaybackTime(Number.NaN), "0:00");
  assert.equal(formatPlaybackTime(-1), "0:00");
});
