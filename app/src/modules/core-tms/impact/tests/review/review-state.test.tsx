import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useReviewList } from "../../application/review/useReviewList";

const entries = Array.from({ length: 127 }, (_, index) => `HOST-TC-${index + 1}`);
let state: ReturnType<typeof useReviewList<string>>;
function Probe({ items = entries }: { items?: string[] }) { state = useReviewList(items, (item) => item); return null; }

test("searching from a later page returns to the first match and clearing search returns to page one", async () => {
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe />); });
  await act(async () => state.setPage(13));
  assert.equal(state.page, 13);
  await act(async () => state.setQuery("HOST-TC-127"));
  assert.equal(state.page, 1);
  assert.deepEqual(state.items, ["HOST-TC-127"]);
  await act(async () => state.setQuery(""));
  assert.equal(state.page, 1);
  assert.equal(state.items.length, 10);
  await act(async () => renderer.unmount());
});

test("a refreshed smaller result does not leave a reviewer on an empty stale page", async () => {
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe />); });
  await act(async () => state.setPage(13));
  await act(async () => renderer.update(<Probe items={entries.slice(0, 12)} />));
  assert.equal(state.page, 2);
  assert.deepEqual(state.items, entries.slice(10, 12));
  await act(async () => renderer.unmount());
});
